import {
  CURRENT_PRODUCTION_FRONTEND_ORIGIN,
  PRODUCTION_FRONTEND_ORIGIN,
  getAllowedCorsOrigins,
} from './cors';

describe('CORS configuration', () => {
  it('allows production frontends and normalized configured origins', () => {
    const origins = getAllowedCorsOrigins({
      NODE_ENV: 'production',
      CORS_ORIGINS: ' https://example.com/path , https://second.example.com/ ',
    });

    expect(origins).toEqual([
      PRODUCTION_FRONTEND_ORIGIN,
      CURRENT_PRODUCTION_FRONTEND_ORIGIN,
      'https://example.com',
      'https://second.example.com',
    ]);
  });

  it('does not allow every origin when CORS_ORIGINS is missing', () => {
    const origins = getAllowedCorsOrigins({ NODE_ENV: 'production' });

    expect(origins).toEqual([
      PRODUCTION_FRONTEND_ORIGIN,
      CURRENT_PRODUCTION_FRONTEND_ORIGIN,
    ]);
  });

  it('allows the local Next.js development origin outside production', () => {
    expect(getAllowedCorsOrigins({ NODE_ENV: 'development' })).toContain(
      'http://localhost:3001',
    );
  });

  it('does not allow the local development origin in production', () => {
    expect(getAllowedCorsOrigins({ NODE_ENV: 'production' })).not.toContain(
      'http://localhost:3001',
    );
  });

  it('does not include unconfigured origins', () => {
    expect(
      getAllowedCorsOrigins({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://example.com',
      }),
    ).not.toContain('https://unauthorized.example.com');
  });
});
