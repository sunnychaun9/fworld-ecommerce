import { describe, expect, it } from 'vitest';

import { buildSwaggerConfig } from './swagger.setup';

describe('buildSwaggerConfig', () => {
  it('sets the API title and the requested version', () => {
    const config = buildSwaggerConfig('1.2.3');
    expect(config.info.title).toBe('FWorld API');
    expect(config.info.version).toBe('1.2.3');
  });

  it('registers JWT bearer and session cookie security schemes', () => {
    const config = buildSwaggerConfig('1.0.0');
    const schemes = config.components?.securitySchemes ?? {};
    expect(schemes.JWT).toMatchObject({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' });
    expect(Object.values(schemes).some((s) => (s as { type?: string }).type === 'apiKey')).toBe(
      true,
    );
  });
});
