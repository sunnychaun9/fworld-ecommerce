import { Module } from '@nestjs/common';

import { PaymentVerificationService } from './payment-verification.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

/**
 * Payments module (authenticated APIs + public webhook; Razorpay foundation and
 * verification). Depends only on the global PrismaModule/ConfigModule.
 */
@Module({
  controllers: [PaymentsController, WebhookController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    RazorpayService,
    PaymentVerificationService,
    WebhookService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
