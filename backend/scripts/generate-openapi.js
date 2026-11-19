"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const fs_1 = require("fs");
const path_1 = require("path");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/common/prisma/prisma.service");
const swagger_config_1 = require("../src/common/swagger/swagger.config");
async function generateOpenApi() {
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
    const moduleRef = await testing_1.Test.createTestingModule({
        imports: [app_module_1.AppModule],
    })
        .overrideProvider(prisma_service_1.PrismaService)
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
    const document = (0, swagger_config_1.buildSwaggerDocument)(app);
    const outPath = (0, path_1.resolve)(__dirname, '..', 'docs', 'openapi.json');
    (0, fs_1.mkdirSync)((0, path_1.dirname)(outPath), { recursive: true });
    (0, fs_1.writeFileSync)(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    await app.close();
    console.log(`OpenAPI specification written to ${outPath}`);
}
generateOpenApi().catch((err) => {
    console.error('Failed to generate OpenAPI specification:', err);
    process.exit(1);
});
//# sourceMappingURL=generate-openapi.js.map