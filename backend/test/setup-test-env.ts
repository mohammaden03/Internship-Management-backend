// Executed before AppModule is imported so ConfigModule.forRoot({ validate: validateEnv }) succeeds in tests
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3010';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/internship_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'e2e_test_access_jwt_secret_key_minimum_32_characters_a';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'e2e_test_refresh_jwt_secret_key_minimum_32_characters_b';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3010';
process.env.UPLOAD_DESTINATION = process.env.UPLOAD_DESTINATION || './uploads/test-documents';
process.env.THROTTLE_TTL_MS = process.env.THROTTLE_TTL_MS || '60000';
process.env.THROTTLE_LIMIT = process.env.THROTTLE_LIMIT || '1000';
process.env.THROTTLE_AUTH_LIMIT = process.env.THROTTLE_AUTH_LIMIT || '1000';
