import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { IS_PUBLIC_KEY, ROLES_KEY } from '../principal';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';

class Sample {
  @Public()
  publicMethod(): void {}

  @Roles('ADMIN', 'MANAGER')
  adminMethod(): void {}

  plainMethod(): void {}
}

const reflector = new Reflector();

describe('auth decorators', () => {
  it('@Public() marks a route public', () => {
    expect(reflector.get(IS_PUBLIC_KEY, Sample.prototype.publicMethod)).toBe(true);
    expect(reflector.get(IS_PUBLIC_KEY, Sample.prototype.plainMethod)).toBeUndefined();
  });

  it('@Roles() records the required roles', () => {
    expect(reflector.get(ROLES_KEY, Sample.prototype.adminMethod)).toEqual(['ADMIN', 'MANAGER']);
    expect(reflector.get(ROLES_KEY, Sample.prototype.plainMethod)).toBeUndefined();
  });
});
