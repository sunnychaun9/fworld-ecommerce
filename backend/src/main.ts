import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';

/**
 * Application bootstrap. Wires cross-cutting infrastructure (security headers,
 * CORS, global validation, versioned route prefix, graceful shutdown).
 * Business modules are registered in AppModule in later phases.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('corsOrigin', 'http://localhost:3000'),
    credentials: true,
  });
  app.setGlobalPrefix(config.get<string>('apiPrefix', 'api/v1'), {
    // Health probes stay at the root for load balancers / orchestrators.
    exclude: ['health', 'health/ready'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableShutdownHooks();

  const port = config.get<number>('port', 4000);
  await app.listen(port);
  Logger.log(`FWorld API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
