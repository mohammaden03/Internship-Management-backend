import { parseCorsOrigins, validateEnv } from './env.validation';

const VALID_BASE_ENV = {
  NODE_ENV: 'development',
  PORT: '3010',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a_very_secure_jwt_secret_key_for_unit_tests_32chars_1',
  JWT_REFRESH_SECRET: 'b_very_secure_refresh_secret_key_for_unit_tests_32chars_2',
  CORS_ORIGINS: 'http://localhost:5173,http://localhost:3010',
  UPLOAD_DESTINATION: './uploads/documents',
};

describe('env.validation', () => {
  it('accepts a valid configuration and defaults PORT to 3010 when omitted', () => {
    const { PORT: _omitted, ...withoutPort } = VALID_BASE_ENV;
    const parsed = validateEnv(withoutPort);
    expect(parsed.PORT).toBe(3010);
    expect(parsed.API_PREFIX).toBe('api');
    expect(parseCorsOrigins(parsed.CORS_ORIGINS)).toEqual([
      'http://localhost:5173',
      'http://localhost:3010',
    ]);
  });

  it('rejects PORT=0, PORT=abc, and PORT=99999', () => {
    expect(() => validateEnv({ ...VALID_BASE_ENV, PORT: '0' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...VALID_BASE_ENV, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...VALID_BASE_ENV, PORT: '99999' })).toThrow(/PORT/);
  });

  it('rejects short, missing, identical, or banned hardcoded JWT secrets', () => {
    expect(() => validateEnv({ ...VALID_BASE_ENV, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() =>
      validateEnv({
        ...VALID_BASE_ENV,
        JWT_SECRET: 'super_secret_jwt_key_university_internship_2026',
      }),
    ).toThrow(/hardcoded default/);
    expect(() =>
      validateEnv({
        ...VALID_BASE_ENV,
        JWT_REFRESH_SECRET: VALID_BASE_ENV.JWT_SECRET,
      }),
    ).toThrow(/distinct/);
  });

  it('rejects wildcard CORS_ORIGINS and placeholder secrets in production', () => {
    expect(() =>
      validateEnv({
        ...VALID_BASE_ENV,
        NODE_ENV: 'production',
        CORS_ORIGINS: '*',
      }),
    ).toThrow(/Wildcard CORS_ORIGINS/);

    expect(() =>
      validateEnv({
        ...VALID_BASE_ENV,
        NODE_ENV: 'production',
        JWT_SECRET: 'change_me_to_something_else_really_long_32chars',
      }),
    ).toThrow(/Placeholder JWT secrets/);
  });
});
