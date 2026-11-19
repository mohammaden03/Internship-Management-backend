import { z } from 'zod';

export const FORBIDDEN_DEFAULT_SECRETS = new Set([
  'super_secret_jwt_key_university_internship_2026',
  'super_refresh_jwt_key_university_internship_2026',
  'secret',
  'changeme',
]);

const portSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === '') return 3010;
    const raw = typeof val === 'number' ? String(val) : val.trim();
    if (!/^\d+$/.test(raw)) {
      return Number.NaN;
    }
    return Number(raw);
  })
  .refine((num) => Number.isInteger(num) && num >= 1 && num <= 65535, {
    message: 'PORT must be a valid integer between 1 and 65535 (never 0 or non-numeric)',
  });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: portSchema,
    API_PREFIX: z.string().trim().min(1).default('api'),
    APP_NAME: z.string().trim().min(1).default('University Internship Management System API'),
    APP_DESCRIPTION: z.string().trim().default('سامانه جامع مدیریت کارآموزی دانشگاه'),
    LOG_LEVEL: z.enum(['debug', 'log', 'warn', 'error']).default('log'),
    DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z
      .string()
      .trim()
      .min(32, 'JWT_SECRET must be at least 32 characters long')
      .refine((v) => !FORBIDDEN_DEFAULT_SECRETS.has(v), {
        message: 'JWT_SECRET must not use an insecure hardcoded default value',
      }),
    JWT_EXPIRATION: z.string().trim().min(1).default('1d'),
    JWT_REFRESH_SECRET: z
      .string()
      .trim()
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long')
      .refine((v) => !FORBIDDEN_DEFAULT_SECRETS.has(v), {
        message: 'JWT_REFRESH_SECRET must not use an insecure hardcoded default value',
      }),
    JWT_REFRESH_EXPIRATION: z.string().trim().min(1).default('7d'),
    CORS_ORIGINS: z
      .string()
      .trim()
      .min(1, 'CORS_ORIGINS must be a comma-separated allowlist of origins')
      .default('http://localhost:3000,http://localhost:3010,http://localhost:5173'),
    UPLOAD_DESTINATION: z
      .string()
      .trim()
      .min(1, 'UPLOAD_DESTINATION is required')
      .default('./uploads/documents'),
    MAX_FILE_SIZE_MB: z.coerce.number().positive().max(100).default(10),
    ALLOWED_MIME_TYPES: z
      .string()
      .trim()
      .min(1)
      .default(
        'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png',
      ),
    THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
    FRONTEND_URL: z.string().trim().url().optional().or(z.literal('')).default('http://localhost:5173'),
    SMTP_URL: z.string().trim().optional(),
    SMTP_FROM: z.string().trim().optional(),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    SENTRY_DSN: z.string().trim().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().trim().optional(),
    AUTO_SEED: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.JWT_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must be distinct from JWT_SECRET',
      });
    }
    if (data.NODE_ENV === 'production') {
      if (
        data.JWT_SECRET.startsWith('change_me') ||
        data.JWT_REFRESH_SECRET.startsWith('change_me')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'Placeholder JWT secrets are forbidden in production',
        });
      }
      if (data.CORS_ORIGINS.includes('*')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGINS'],
          message: 'Wildcard CORS_ORIGINS (*) is forbidden in production',
        });
      }
    }
  });

export type AppEnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}

export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
