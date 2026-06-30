import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/**
 * Application bootstrap. The request pipeline (including the Better Auth handler
 * mounting and body-parser ordering) is configured by `configureApp` so it is
 * shared with the integration tests. Nest's built-in body parser is disabled so
 * the Better Auth handler receives the unparsed request stream.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const config = app.get(ConfigService);

  configureApp(app, config);
  app.enableShutdownHooks();

  const port = config.get<number>('port', 4000);
  await app.listen(port);
  Logger.log(`FWorld API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
