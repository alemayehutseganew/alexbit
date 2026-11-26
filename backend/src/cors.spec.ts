import {
  CURRENT_PRODUCTION_FRONTEND_ORIGIN,
  PRODUCTION_FRONTEND_ORIGIN,
  createCorsOriginCallback,
  getAllowedCorsOrigins,
  isCorsOriginAllowed,
} from './cors';

describe('CORS configuration', () => {
  it('allows the production frontend and a trimmed CORS_ORIGINS entry', () => {
    const origins = getAllowedCorsOrigins({
      CORS_ORIGINS: ' https://example.com , https://second.example.com ',
    });

    expect(origins).toEqual([
      PRODUCTION_FRONTEND_ORIGIN,
      CURRENT_PRODUCTION_FRONTEND_ORIGIN,
      'https://example.com',
      'https://second.example.com',
    ]);
  });

  it('allows the production origin', () => {
    const callback = createCorsOriginCallback({
      CORS_ORIGINS: 'https://example.com',
    });
    const allow = jest.fn();

    callback(PRODUCTION_FRONTEND_ORIGIN, allow);

    expect(allow).toHaveBeenCalledWith(null, true);
  });

  it('allows the current Vercel frontend origin', () => {
    const callback = createCorsOriginCallback({});
    const allow = jest.fn();

    callback(CURRENT_PRODUCTION_FRONTEND_ORIGIN, allow);

    expect(allow).toHaveBeenCalledWith(null, true);
  });

  it('rejects an unauthorized origin', () => {
    const callback = createCorsOriginCallback({
      CORS_ORIGINS: 'https://example.com',
    });
    const allow = jest.fn();

    callback('https://unauthorized.example.com', allow);

    expect(allow).toHaveBeenCalledWith(null, false);
  });

  it('does not allow every origin when CORS_ORIGINS is missing', () => {
    const origins = getAllowedCorsOrigins({});

    expect(origins).toEqual([
      PRODUCTION_FRONTEND_ORIGIN,
      CURRENT_PRODUCTION_FRONTEND_ORIGIN,
    ]);
  });

  it('allows requests without an Origin header', () => {
    expect(isCorsOriginAllowed(undefined, {})).toBe(true);
  });

  it('rejects unauthorized Origin values explicitly', () => {
    expect(
      isCorsOriginAllowed('https://unauthorized.example.com', {
        CORS_ORIGINS: 'https://example.com',
      }),
    ).toBe(false);
  });
});
