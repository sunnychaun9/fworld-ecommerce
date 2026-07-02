import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import type { RequestWithPrincipal } from '../../auth/principal';
import { AuditEntry, AuditService } from './audit.service';

type EntityIdSource = 'param:id' | 'body:variantId' | 'result:id';

interface AuditRouteConfig {
  action: string;
  entity: string;
  entityId?: EntityIdSource;
  metaFromBody?: boolean;
}

/**
 * Which controller handlers are audited, keyed by controller class name then
 * handler method name. Adding a route here logs it without touching that module.
 */
const AUDIT_ROUTES: Record<string, Record<string, AuditRouteConfig>> = {
  AdminOrdersController: {
    updateStatus: {
      action: 'ORDER_STATUS_CHANGED',
      entity: 'ORDER',
      entityId: 'param:id',
      metaFromBody: true,
    },
  },
  AdminInventoryController: {
    adjust: {
      action: 'INVENTORY_ADJUSTED',
      entity: 'INVENTORY',
      entityId: 'body:variantId',
      metaFromBody: true,
    },
  },
  AdminProductsController: {
    setStatus: { action: 'PRODUCTS_BULK_STATUS', entity: 'PRODUCT', metaFromBody: true },
    setFeatured: { action: 'PRODUCTS_BULK_FEATURED', entity: 'PRODUCT', metaFromBody: true },
    softDelete: { action: 'PRODUCTS_BULK_DELETED', entity: 'PRODUCT', metaFromBody: true },
    restore: { action: 'PRODUCTS_BULK_RESTORED', entity: 'PRODUCT', metaFromBody: true },
  },
  CouponsController: {
    create: {
      action: 'COUPON_CREATED',
      entity: 'COUPON',
      entityId: 'result:id',
      metaFromBody: true,
    },
    update: {
      action: 'COUPON_UPDATED',
      entity: 'COUPON',
      entityId: 'param:id',
      metaFromBody: true,
    },
    remove: { action: 'COUPON_DELETED', entity: 'COUPON', entityId: 'param:id' },
  },
  ShippingController: {
    create: {
      action: 'SHIPMENT_CREATED',
      entity: 'SHIPMENT',
      entityId: 'result:id',
      metaFromBody: true,
    },
    update: {
      action: 'SHIPMENT_UPDATED',
      entity: 'SHIPMENT',
      entityId: 'param:id',
      metaFromBody: true,
    },
  },
  ReturnsController: {
    adminUpdate: {
      action: 'RETURN_DECISION',
      entity: 'RETURN',
      entityId: 'param:id',
      metaFromBody: true,
    },
  },
};

/**
 * Global interceptor that records an audit log for whitelisted admin routes on
 * success. Cross-cutting — the audited feature modules are never modified.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const config = AUDIT_ROUTES[context.getClass().name]?.[context.getHandler().name];
    if (!config) {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<RequestWithPrincipal>();
    return next
      .handle()
      .pipe(
        mergeMap((data) =>
          this.audit.record(this.buildEntry(config, request, data)).then(() => data),
        ),
      );
  }

  private buildEntry(
    config: AuditRouteConfig,
    request: RequestWithPrincipal,
    data: unknown,
  ): AuditEntry {
    const body = request.body as Record<string, unknown> | undefined;
    let entityId: string | null = null;
    if (config.entityId === 'param:id') {
      entityId = typeof request.params?.id === 'string' ? request.params.id : null;
    } else if (config.entityId === 'body:variantId') {
      entityId = typeof body?.variantId === 'string' ? body.variantId : null;
    } else if (config.entityId === 'result:id') {
      entityId =
        data &&
        typeof data === 'object' &&
        'id' in data &&
        typeof (data as { id: unknown }).id === 'string'
          ? (data as { id: string }).id
          : null;
    }
    return {
      actorId: request.principal?.userId ?? null,
      action: config.action,
      entity: config.entity,
      entityId,
      metadata: config.metaFromBody && body && typeof body === 'object' ? body : undefined,
    };
  }
}
