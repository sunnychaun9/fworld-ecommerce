import { describe, expect, it } from 'vitest';

import { newId } from './id.util';

const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('newId', () => {
  it('generates a valid UUID v7 (version nibble = 7)', () => {
    expect(newId()).toMatch(UUID_V7_RE);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });
});
