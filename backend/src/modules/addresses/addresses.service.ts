import { Injectable, NotFoundException } from '@nestjs/common';

import { newId } from '../../common/utils/id.util';
import { AddressesRepository } from './addresses.repository';
import { CreateAddressDto, UUID_PATTERN } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/**
 * Address service. Users manage only their own addresses; at most one default
 * address exists (setting a new default clears the previous one). Holds business
 * logic only; every Prisma query is delegated to {@link AddressesRepository}.
 */
@Injectable()
export class AddressesService {
  constructor(private readonly repository: AddressesRepository) {}

  list(userId: string) {
    return this.repository.findManyByUser(userId);
  }

  getById(userId: string, id: string) {
    return this.getOwned(userId, id);
  }

  async create(userId: string, dto: CreateAddressDto) {
    const created = await this.repository.create({
      id: newId(),
      userId,
      fullName: dto.fullName,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country ?? 'India',
      isDefault: false,
    });
    if (dto.isDefault) {
      return this.repository.setDefault(userId, created.id);
    }
    return created;
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    await this.getOwned(userId, id);
    const updated = await this.repository.update(id, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.addressLine1 !== undefined ? { addressLine1: dto.addressLine1 } : {}),
      ...(dto.addressLine2 !== undefined ? { addressLine2: dto.addressLine2 } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.isDefault === false ? { isDefault: false } : {}),
    });
    if (dto.isDefault === true) {
      return this.repository.setDefault(userId, id);
    }
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.getOwned(userId, id);
    await this.repository.delete(id);
    return { id };
  }

  async setDefault(userId: string, id: string) {
    await this.getOwned(userId, id);
    return this.repository.setDefault(userId, id);
  }

  private async getOwned(userId: string, id: string) {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const address = await this.repository.findById(userId, id);
    if (!address) {
      throw this.notFound();
    }
    return address;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Address not found' });
  }
}
