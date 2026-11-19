import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

async function generateOpenApi() {
  // Supply deterministic non-production env vars BEFORE dynamically importing AppModule
  process.env.NODE_ENV = 'test';
  process.env.PORT = process.env.PORT || '3010';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://localhost:5432/internship_openapi_stub';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'openapi_generation_jwt_secret_key_32chars_min_a';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'openapi_generation_refresh_secret_key_32chars_b';
  process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:5173';
  process.env.UPLOAD_DESTINATION = process.env.UPLOAD_DESTINATION || './uploads/documents';

  const [{ Test }, { AppModule }, { PrismaService }, { buildSwaggerDocument }] = await Promise.all([
    import('@nestjs/testing'),
    import('../src/app.module'),
    import('../src/common/prisma/prisma.service'),
    import('../src/common/swagger/swagger.config'),
  ]);

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: async () => undefined,
      $disconnect: async () => undefined,
      $queryRaw: async () => [{ '?column?': 1 }],
    })
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  const prefix = (process.env.API_PREFIX || 'api').replace(/^\/+|\/+$/g, '');
  app.setGlobalPrefix(prefix);
  await app.init();

  const document = buildSwaggerDocument(app);
  const outPath = resolve(__dirname, '..', 'docs', 'openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI specification written to ${outPath}`);
}

generateOpenApi().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI specification:', err);
  process.exit(1);
});
