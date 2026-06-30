import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { PrismaService } from '../database/prisma.service';
import { AuthStatusController } from './auth-status.controller';
import { AuthGuard } from './auth.guard';
import { BETTER_AUTH } from './auth.constants';
import { createAuth, type Auth } from './auth.factory';
import { MeController } from './me.controller';

/**
 * Authentication module (Milestone 2.2).
 *
 * Provides the singleton Better Auth instance (email/password + email
 * verification enabled), the global deny-by-default AuthGuard, and the
 * authenticated `/me` endpoint. Auth method endpoints (register/login/logout/
 * session) are served natively by Better Auth at `/api/v1/auth/*`.
 */
@Module({
  controllers: [AuthStatusController, MeController],
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService): Auth => {
        const logger = new Logger('EmailVerification');
        return createAuth({
          prisma,
          secret: config.getOrThrow<string>('auth.secret'),
          baseURL: config.getOrThrow<string>('auth.baseURL'),
          trustedOrigins: config.get<string[]>('auth.trustedOrigins') ?? [],
          useSecureCookies: config.get<string>('nodeEnv') === 'production',
          // Abstracted delivery — real transport (Resend) is a later milestone.
          sendVerificationEmail: ({ email, url }) => {
            logger.log(`Verification email for ${email}: ${url}`);
          },
        });
      },
    },
    // Global, deny-by-default authentication guard.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [BETTER_AUTH],
})
export class AuthModule {}
