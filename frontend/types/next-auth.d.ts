import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

type KeycloakProviderId = "keycloak-client" | "keycloak-shareholder";
type AuthProviderId = KeycloakProviderId | "credentials";
type AuthRole =
  | "CLIENT"
  | "CLIENT_ADMIN"
  | "SHAREHOLDER"
  | "SHAREHOLDER_ADMIN"
  | "SHAREHOLDER_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "PROJECT_MANAGER";
type PortalRole = "CLIENT" | "SHAREHOLDER" | "ADMIN";

declare module "next-auth" {
  interface User {
    role?: AuthRole;
    tenantId?: string;
    accessToken?: string;
  }

  interface Session {
    authProvider?: AuthProviderId;
    role?: PortalRole;
    tenantId?: string;
    accessToken?: string;
    user: {
      role?: AuthRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: AuthProviderId;
    role?: PortalRole;
    userRole?: AuthRole;
    tenantId?: string;
    keycloakAccessToken?: string;
    accessTokenExpiresAt?: number;
    accessToken?: string;
  }
}
