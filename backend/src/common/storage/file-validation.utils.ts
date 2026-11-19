import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export interface ValidatedFileType {
  extension: string;
  detectedMime: string;
}

const DEFAULT_ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

export function getAllowedMimeTypesFromEnv(): string[] {
  const raw = process.env.ALLOWED_MIME_TYPES;
  if (!raw || !raw.trim()) {
    return DEFAULT_ALLOWED_MIMES;
  }
  return raw
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
}

export function getMaxFileSizeBytesFromEnv(): number {
  const mb = Number(process.env.MAX_FILE_SIZE_MB || '10');
  const validMb = Number.isFinite(mb) && mb > 0 ? Math.min(mb, 100) : 10;
  return Math.floor(validMb * 1024 * 1024);
}

export function detectMimeFromMagicBytes(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // PDF: "%PDF-" (25 50 44 46 2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return 'application/pdf';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // Legacy MS Word (.doc) OLE2 Compound File: D0 CF 11 E0 A1 B1 1A E1
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return 'application/msword';
  }

  // DOCX (OpenXML ZIP): PK\x03\x04
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return null;
}

export function validateUploadedFile(file: Express.Multer.File): ValidatedFileType {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestException('Uploaded file is empty or missing');
  }

  const maxBytes = getMaxFileSizeBytesFromEnv();
  if (file.size > maxBytes || file.buffer.length > maxBytes) {
    throw new BadRequestException(
      `File exceeds maximum allowed size of ${Math.round(maxBytes / (1024 * 1024))}MB`,
    );
  }

  const allowedMimes = getAllowedMimeTypesFromEnv();
  const ext = extname(file.originalname || '').toLowerCase();
  const expectedMimeForExt = EXTENSION_TO_MIME[ext];

  if (!expectedMimeForExt || !allowedMimes.includes(expectedMimeForExt)) {
    throw new BadRequestException(
      `Disallowed file extension '${ext || '(none)'}'. Allowed formats: PDF, DOC, DOCX, JPG, PNG`,
    );
  }

  if (!allowedMimes.includes(file.mimetype)) {
    throw new BadRequestException(
      `Unsupported file MIME type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`,
    );
  }

  const detectedMime = detectMimeFromMagicBytes(file.buffer);
  if (!detectedMime || detectedMime !== expectedMimeForExt) {
    throw new BadRequestException(
      `File binary signature does not match declared file type (${ext}). Upload rejected for security reasons.`,
    );
  }

  return {
    extension: ext,
    detectedMime,
  };
}

export function sanitizeDownloadFilename(originalName: string): {
  asciiFallback: string;
  utf8Encoded: string;
} {
  const cleaned = (originalName || 'document')
    .replace(/[\r\n\0"\\\/<>:|?*]/g, '_')
    .trim()
    .slice(0, 180) || 'document';

  const asciiFallback = cleaned.replace(/[^\x20-\x7E]/g, '_') || 'document';
  const utf8Encoded = encodeURIComponent(cleaned);

  return { asciiFallback, utf8Encoded };
}
