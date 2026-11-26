export const PRODUCTION_FRONTEND_ORIGIN = 'https://alexbit-wine.vercel.app';

export function getAllowedCorsOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const configuredOrigins = [env.CORS_ORIGINS, env.FRONTEND_URL]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([PRODUCTION_FRONTEND_ORIGIN, ...configuredOrigins])];
}

export function createCorsOriginCallback(env: NodeJS.ProcessEnv = process.env) {
  const allowedOrigins = new Set(getAllowedCorsOrigins(env));

  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return !origin || getAllowedCorsOrigins(env).includes(origin);
}
