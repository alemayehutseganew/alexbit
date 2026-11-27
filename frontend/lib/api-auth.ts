import "server-only";

import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function getKeycloakAccessToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const cookieHeader = (await cookies())
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const token = await getToken({
    req: new Request("https://auth.local", {
      headers: { cookie: cookieHeader },
    }),
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token?.keycloakAccessToken) {
    throw new Error("Keycloak access token is not available in this session");
  }

  return token.keycloakAccessToken;
}
