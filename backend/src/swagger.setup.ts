import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Path (outside the global API prefix) where Swagger UI is served. */
export const SWAGGER_PATH = 'api/docs';

/**
 * Builds the base OpenAPI definition. Pure/deterministic so it can be unit-tested
 * without booting the app. Auth schemes: `JWT` (bearer) and the Better Auth
 * session cookie. DTO/response schemas are enriched automatically by the
 * `@nestjs/swagger` CLI plugin (see nest-cli.json) — no handwritten JSON.
 */
export function buildSwaggerConfig(version: string): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('FWorld API')
    .setDescription("FWorld — premium men's fashion e-commerce API.")
    .setVersion(version)
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addCookieAuth('better-auth.session_token')
    .build();
}

/** Mounts Swagger UI at {@link SWAGGER_PATH} (`/api/docs`) and its JSON document. */
export function setupSwagger(app: INestApplication, version: string): void {
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig(version));
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
