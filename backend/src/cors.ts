export const PRODUCTION_FRONTEND_ORIGIN =
  'https://primehorizonplc.vercel.app';

const productionFrontendOrigins = [PRODUCTION_FRONTEND_ORIGIN];
const localFrontendOrigins = ['http://localhost:3000'];

export function getAllowedCorsOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const configuredOrigins = [env.CORS_ORIGINS, env.FRONTEND_URL]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => new URL(value).origin);
  const developmentOrigins =
    env.NODE_ENV === 'production' ? [] : localFrontendOrigins;

  return [
    ...new Set([
      ...productionFrontendOrigins,
      ...developmentOrigins,
      ...configuredOrigins,
    ]),
  ];
}
