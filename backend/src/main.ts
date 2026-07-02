import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { setupSwagger, SWAGGER_PATH } from './swagger.setup';

/**
 * Application bootstrap. The request pipeline (Better Auth mounting, security
 * middleware and body-parser ordering) is configured by `configureApp` so it is
 * shared with the integration tests. Nest's built-in body parser is disabled so
 * the Better Auth handler receives the unparsed request stream. Shutdown hooks
 * are enabled for graceful termination (SIGTERM/SIGINT) in containers.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const config = app.get(ConfigService);
  const version = config.get<string>('version', '0.1.0');
  const nodeEnv = config.get<string>('nodeEnv', 'development');

  configureApp(app, config);
  setupSwagger(app, version);
  app.enableShutdownHooks();

  const port = config.get<number>('port', 4000);
  await app.listen(port);

  logger.log(`FWorld API v${version} [${nodeEnv}] listening on http://localhost:${port}`);
  logger.log(`API docs available at http://localhost:${port}/${SWAGGER_PATH}`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Fatal error during startup', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
