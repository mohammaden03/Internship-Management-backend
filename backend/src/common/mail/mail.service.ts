import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface PasswordResetEmailPayload {
  to: string;
  recipientName: string;
  resetUrl: string;
  expiresInMinutes: number;
  rawToken?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private fromAddress = 'no-reply@university.ac.ir';

  /**
   * Optional test hook allowing automated tests to inspect sent messages
   * without logging raw tokens to stdout in production.
   */
  public lastSentResetPayload: PasswordResetEmailPayload | null = null;

  onModuleInit() {
    const smtpUrl = process.env.SMTP_URL?.trim();
    this.fromAddress = process.env.SMTP_FROM?.trim() || this.fromAddress;

    if (smtpUrl) {
      this.transporter = nodemailer.createTransport(smtpUrl);
      this.logger.log('SMTP mail transporter initialized');
    } else if (process.env.NODE_ENV !== 'test') {
      this.logger.warn(
        'SMTP_URL is not configured; password reset emails will not be delivered externally. Set SMTP_URL and SMTP_FROM to enable email delivery.',
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.lastSentResetPayload = payload;
    }

    if (!this.transporter) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          `Password reset requested for ${payload.to}, but SMTP_URL is not configured. Configure SMTP_URL to send real emails.`,
        );
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject: 'بازیابی رمز عبور سامانه مدیریت کارآموزی دانشگاه',
        text: `سلام ${payload.recipientName}،\n\nبرای تنظیم رمز عبور جدید روی لینک زیر کلیک کنید (معتبر به مدت ${payload.expiresInMinutes} دقیقه):\n${payload.resetUrl}\n\nاگر این درخواست از سوی شما نبوده است، این پیام را نادیده بگیرید.`,
        html: `<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.8;">
          <p>سلام <strong>${payload.recipientName}</strong>،</p>
          <p>برای تنظیم رمز عبور جدید روی دکمه زیر کلیک کنید (معتبر به مدت ${payload.expiresInMinutes} دقیقه):</p>
          <p><a href="${payload.resetUrl}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">تنظیم رمز عبور جدید</a></p>
          <p style="color:#666;font-size:12px;">اگر این درخواست از سوی شما نبوده است، این ایمیل را نادیده بگیرید.</p>
        </div>`,
      });
    } catch (err) {
      // Never leak raw token or resetUrl in logs
      this.logger.error(
        `Failed to send password reset email to ${payload.to}: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }
}
