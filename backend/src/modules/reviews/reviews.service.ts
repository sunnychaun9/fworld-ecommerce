import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CreateReviewDto, UUID_PATTERN } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsRepository } from './reviews.repository';

/**
 * Review service: verified-purchase gating, one review per user/product, and a
 * product view returning live-computed rating aggregates. Holds business logic
 * only; every Prisma query is delegated to {@link ReviewsRepository}.
 */
@Injectable()
export class ReviewsService {
  constructor(private readonly repository: ReviewsRepository) {}

  async create(userId: string, dto: CreateReviewDto) {
    if (!(await this.repository.hasPurchased(userId, dto.productId))) {
      throw new UnprocessableEntityException({
        code: 'PURCHASE_REQUIRED',
        message: 'You can only review products you have purchased',
      });
    }
    if (await this.repository.findEntry(userId, dto.productId)) {
      throw new ConflictException({
        code: 'ALREADY_REVIEWED',
        message: 'You have already reviewed this product',
      });
    }
    try {
      return await this.repository.create({
        id: newId(),
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title ?? null,
        comment: dto.comment ?? null,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'ALREADY_REVIEWED',
          message: 'You have already reviewed this product',
        });
      }
      throw error;
    }
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    await this.getOwned(userId, id);
    return this.repository.update(id, {
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
    });
  }

  async remove(userId: string, id: string) {
    await this.getOwned(userId, id);
    await this.repository.delete(id);
    return { id };
  }

  async listByProduct(productId: string) {
    const [aggregate, reviews] = await Promise.all([
      this.repository.aggregate(productId),
      this.repository.listByProduct(productId),
    ]);
    return { ...aggregate, reviews };
  }

  listMine(userId: string) {
    return this.repository.listByUser(userId);
  }

  private async getOwned(userId: string, id: string) {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const review = await this.repository.findById(userId, id);
    if (!review) {
      throw this.notFound();
    }
    return review;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Review not found' });
  }
}
