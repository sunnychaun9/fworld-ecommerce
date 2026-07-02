import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AddressesRepository } from './addresses.repository';
import { AddressesService } from './addresses.service';

interface RepoMock {
  findManyByUser: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  setDefault: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const AID = '01920000-0000-7000-8000-0000000000a1';

const ADDRESS = {
  fullName: 'Jane',
  phone: '9999999999',
  addressLine1: '1 Road',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
};

function makeService(): { service: AddressesService; repo: RepoMock } {
  const repo: RepoMock = {
    findManyByUser: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue({ id: AID, userId: USER }),
    create: vi.fn().mockResolvedValue({ id: AID, isDefault: false }),
    update: vi.fn().mockResolvedValue({ id: AID }),
    delete: vi.fn(),
    setDefault: vi.fn().mockResolvedValue({ id: AID, isDefault: true }),
  };
  return { service: new AddressesService(repo as unknown as AddressesRepository), repo };
}

describe('AddressesService', () => {
  it('creates a non-default address without touching other defaults', async () => {
    const { service, repo } = makeService();
    await service.create(USER, ADDRESS);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.setDefault).not.toHaveBeenCalled();
  });

  it('creates a default address and switches the default', async () => {
    const { service, repo } = makeService();
    await service.create(USER, { ...ADDRESS, isDefault: true });
    expect(repo.setDefault).toHaveBeenCalledWith(USER, AID);
  });

  it('returns 404 for an address owned by another user', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(null);
    await expect(service.getById(USER, AID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('switches the default on update when isDefault=true', async () => {
    const { service, repo } = makeService();
    await service.update(USER, AID, { isDefault: true });
    expect(repo.setDefault).toHaveBeenCalledWith(USER, AID);
  });

  it('clears default on update when isDefault=false', async () => {
    const { service, repo } = makeService();
    await service.update(USER, AID, { isDefault: false });
    expect(repo.update).toHaveBeenCalledWith(AID, { isDefault: false });
    expect(repo.setDefault).not.toHaveBeenCalled();
  });

  it('rejects updating a non-owned address (404)', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(null);
    await expect(service.update(USER, AID, { city: 'Pune' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('sets a default only for an owned address', async () => {
    const { service, repo } = makeService();
    await service.setDefault(USER, AID);
    expect(repo.setDefault).toHaveBeenCalledWith(USER, AID);
    repo.findById.mockResolvedValue(null);
    await expect(service.setDefault(USER, AID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes only an owned address', async () => {
    const { service, repo } = makeService();
    await service.remove(USER, AID);
    expect(repo.delete).toHaveBeenCalledWith(AID);
  });

  it('returns 404 for a non-UUID id', async () => {
    const { service, repo } = makeService();
    await expect(service.getById(USER, 'nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});
