import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface SystemSettingsResponse {
  academicTerm: string;
  registrationStart: string;
  registrationEnd: string;
  gradingDeadline: string;
  minHours: number;
  maxWeeklyHours: number;
  autoIssueLetter: boolean;
  insuranceEnabled: boolean;
  updatedAt: string;
}

const DEFAULT_SETTINGS: Omit<SystemSettingsResponse, 'updatedAt'> = {
  academicTerm: '۱۴۰۳-۱۴۰۴ نیمسال اول',
  registrationStart: '2024-09-01',
  registrationEnd: '2024-10-15',
  gradingDeadline: '2025-01-20',
  minHours: 240,
  maxWeeklyHours: 40,
  autoIssueLetter: true,
  insuranceEnabled: true,
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(): Promise<SystemSettingsResponse> {
    const rows = await this.prisma.systemSetting.findMany();
    const map = new Map<string, string>();
    let latestUpdatedAt = new Date(0);

    for (const row of rows) {
      map.set(row.key, row.value);
      if (row.updatedAt && new Date(row.updatedAt) > latestUpdatedAt) {
        latestUpdatedAt = new Date(row.updatedAt);
      }
    }

    const parseNumber = (key: string, fallback: number): number => {
      const raw = map.get(key);
      if (raw === undefined) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const parseBoolean = (key: string, fallback: boolean): boolean => {
      const raw = map.get(key);
      if (raw === undefined) return fallback;
      return raw === 'true' || raw === '1';
    };

    return {
      academicTerm: map.get('academicTerm') ?? DEFAULT_SETTINGS.academicTerm,
      registrationStart: map.get('registrationStart') ?? DEFAULT_SETTINGS.registrationStart,
      registrationEnd: map.get('registrationEnd') ?? DEFAULT_SETTINGS.registrationEnd,
      gradingDeadline: map.get('gradingDeadline') ?? DEFAULT_SETTINGS.gradingDeadline,
      minHours: parseNumber('minHours', DEFAULT_SETTINGS.minHours),
      maxWeeklyHours: parseNumber('maxWeeklyHours', DEFAULT_SETTINGS.maxWeeklyHours),
      autoIssueLetter: parseBoolean('autoIssueLetter', DEFAULT_SETTINGS.autoIssueLetter),
      insuranceEnabled: parseBoolean('insuranceEnabled', DEFAULT_SETTINGS.insuranceEnabled),
      updatedAt:
        latestUpdatedAt.getTime() > 0
          ? latestUpdatedAt.toISOString()
          : new Date().toISOString(),
    };
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<SystemSettingsResponse> {
    const entries = Object.entries(dto).filter(([, value]) => value !== undefined);

    if (entries.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const [key, value] of entries) {
          await tx.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          });
        }
      });
    }

    return this.getSettings();
  }
}
