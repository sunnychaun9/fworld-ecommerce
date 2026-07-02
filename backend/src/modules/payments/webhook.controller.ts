import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../../auth/decorators/public.decorator';
import { RazorpayWebhookEvent, WebhookService } from './webhook.service';

type RequestWithRawBody = Request & { rawBody?: Buffer };

/**
 * Public Razorpay webhook receiver. Signature is verified from the raw request
 * body (captured by the global json body parser). No AuthGuard (server-to-server).
 */
@Public()
@Controller('payments/webhook')
export class WebhookController {
  constructor(private readonly webhook: WebhookService) {}

  @Post()
  handle(
    @Req() req: RequestWithRawBody,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: RazorpayWebhookEvent,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body ?? {}));
    return this.webhook.handle(rawBody, signature, body);
  }
}
