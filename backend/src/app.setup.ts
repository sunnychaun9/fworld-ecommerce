import { ValidationPipe } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import helmet from 'helmet';

import { BETTER_AUTH } from './auth/auth.constants';
import type { Auth } from './auth/auth.factory';

/**
 * Configure the HTTP request pipeline. Shared by `main.ts` and the integration
 * tests so both exercise the identical middleware ordering.
 *
 * Order (Express runs middleware in registration order; Nest's router is added
 * last on `listen()`/`init()`):
 *   helmet → CORS → Better Auth(/api/v1/auth) → json/urlencoded → Nest router.
 *
 * The Better Auth handler receives the RAW body and terminates its own
 * responses, so `/api/v1/auth/*` bypasses Nest (router, interceptors, filter,
 * pipe). The app must be created with `{ bodyParser: false }`.
 */
export function configureApp(app: NestExpressApplication, config: ConfigService): void {
  const expressApp = app.getHttpAdapter().getInstance();

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('corsOrigin', 'http://localhost:3000'),
    credentials: true,
  });

  const auth = app.get<Auth>(BETTER_AUTH);
  expressApp.use('/api/v1/auth', toNodeHandler(auth));

  expressApp.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  expressApp.use(express.urlencoded({ extended: true }));

  app.setGlobalPrefix(config.get<string>('apiPrefix', 'api/v1'), {
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
}
