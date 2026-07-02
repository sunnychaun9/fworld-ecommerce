import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ReturnStatus } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CreateReturnDto } from './dto/create-return.dto';
import { ReturnDecisionStatus, UpdateReturnDto } from './dto/update-return.dto';
import { ReturnsRepository } from './returns.repository';

const RETURN_WINDOW_DAYS = 7;
const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Allowed return-status transitions; REJECTED and REFUNDED are terminal. */
const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['RECEIVED', 'REJECTED'],
  RECEIVED: ['REFUNDED'],
  REJECTED: [],
  REFUNDED: [],
};

/**
 * Returns & refunds service. A return is only eligible for a delivered order,
 * within a 7-day window, once per order item; refund amount is captured from the
 * order item's line total. Admins advance the lifecycle with a stored reason.
 * Holds business logic only; every Prisma query is delegated to the repository.
 */
@Injectable()
export class ReturnsService {
  constructor(private readonly repository: ReturnsRepository) {}

  async create(userId: string, dto: CreateReturnDto) {
    const context = await this.repository.findOrderItemContext(dto.orderItemId);
    if (!context || context.order.userId !== userId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order item not found' });
    }
    if (context.order.status !== 'DELIVERED') {
      throw new UnprocessableEntityException({
        code: 'ORDER_NOT_DELIVERED',
        message: 'Only delivered orders can be returned',
      });
    }

    const deliveredAt = context.order.shipment?.deliveredAt ?? context.order.updatedAt;
    if (Date.now() - deliveredAt.getTime() > RETURN_WINDOW_MS) {
      throw new UnprocessableEntityException({
        code: 'RETURN_WINDOW_EXPIRED',
        message: `Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery`,
      });
    }

    if (await this.repository.findByOrderItemId(dto.orderItemId)) {
      throw new ConflictException({
        code: 'RETURN_EXISTS',
        message: 'A return already exists for this order item',
      });
    }

    return this.repository.create({
      id: newId(),
      userId,
      orderId: context.orderId,
      orderItemId: dto.orderItemId,
      status: 'REQUESTED',
      reason: dto.reason,
      refundAmount: Number(context.lineTotal),
    });
  }

  list(userId: string) {
    return this.repository.findManyByUser(userId);
  }

  async getById(userId: string, id: string) {
    const found = await this.repository.findByIdForUser(userId, id);
    if (!found) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Return not found' });
    }
    return found;
  }

  async adminUpdate(id: string, dto: UpdateReturnDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Return not found' });
    }
    const target = dto.status as ReturnStatus;
    if (!TRANSITIONS[existing.status].includes(target)) {
      throw new UnprocessableEntityException({
        code: 'INVALID_RETURN_TRANSITION',
        message: `Cannot change return status from ${existing.status} to ${target}`,
      });
    }

    return this.repository.update(id, {
      status: target,
      ...(dto.decisionReason !== undefined ? { decisionReason: dto.decisionReason } : {}),
      ...(dto.refundAmount !== undefined ? { refundAmount: dto.refundAmount } : {}),
    });
  }

  /** Exposed for reuse/testing of the transition table. */
  canTransition(from: ReturnStatus, to: ReturnDecisionStatus): boolean {
    return TRANSITIONS[from].includes(to as ReturnStatus);
  }
}
