import Credentials from 'next-auth/providers/credentials';
import Keycloak from 'next-auth/providers/keycloak';
import NextAuth, { CredentialsSignin, type NextAuthResult } from 'next-auth';

class CustomAuthError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

const clientProviderId = 'keycloak-client';
const shareholderProviderId = 'keycloak-shareholder';
const clientKeycloakOptions = {
  clientId:
    process.env.AUTH_KEYCLOAK_CLIENT_ID ?? process.env.KEYCLOAK_CLIENT_ID,
  clientSecret:
    process.env.AUTH_KEYCLOAK_CLIENT_SECRET ??
    process.env.KEYCLOAK_CLIENT_SECRET,
  issuer:
    process.env.AUTH_KEYCLOAK_CLIENT_ISSUER ?? process.env.KEYCLOAK_ISSUER,
};
const shareholderKeycloakOptions = {
  clientId: process.env.AUTH_KEYCLOAK_SHAREHOLDER_ID,
  clientSecret: process.env.AUTH_KEYCLOAK_SHAREHOLDER_SECRET,
  issuer: process.env.AUTH_KEYCLOAK_SHAREHOLDER_ISSUER,
};
export const clientKeycloakConfigured = Object.values(
  clientKeycloakOptions,
).every(Boolean);
export const shareholderKeycloakConfigured = Object.values(
  shareholderKeycloakOptions,
).every(Boolean);
const keycloakProvidersEnabled = process.env.NODE_ENV === 'production';

const credentialsProvider = Credentials({
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
    realm: { label: 'Realm', type: 'text' },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }

      const res = await fetch(
        `${apiUrl}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        }
      );

      if (!res.ok) {
        return null;
      }

      const data: unknown = await res.json();
      if (!isCredentialResponse(data)) {
        throw new Error('Authentication API returned an invalid response.');
      }

      const user = data.user;
      if (
        user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN' &&
        user.role !== 'PROJECT_MANAGER'
      ) {
        const realm =
          typeof credentials.realm === 'string'
            ? credentials.realm
            : 'client';
        if (
          realm === 'client' &&
          user.role !== 'CLIENT' &&
          user.role !== 'CLIENT_ADMIN'
        ) {
          throw new CustomAuthError('Please use the Shareholder Portal.');
        }
        if (realm === 'shareholder' && user.role !== 'SHAREHOLDER') {
          throw new CustomAuthError('Please use the Client Portal.');
        }
      }

      return {
        ...user,
        name: `${user.firstName} ${user.lastName}`,
        accessToken: data.accessToken,
      };
    } catch (error) {
      if (error instanceof CustomAuthError) throw error;
      console.error('NextAuth authorize error:', error);
      return null;
    }
  },
});

type CredentialRole =
  | 'CLIENT'
  | 'CLIENT_ADMIN'
  | 'SHAREHOLDER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'PROJECT_MANAGER';

type PortalRole = 'CLIENT' | 'SHAREHOLDER' | 'ADMIN';

function portalRole(role: CredentialRole): PortalRole {
  if (role === 'SHAREHOLDER') {
    return 'SHAREHOLDER';
  }
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return 'ADMIN';
  }
  return 'CLIENT';
}

function isCredentialResponse(value: unknown): value is {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    role: CredentialRole;
  };
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Record<string, unknown>;
  const user = response.user;
  if (!user || typeof user !== 'object') {
    return false;
  }

  const userRecord = user as Record<string, unknown>;
  return (
    typeof response.accessToken === 'string' &&
    typeof userRecord.id === 'string' &&
    typeof userRecord.email === 'string' &&
    typeof userRecord.firstName === 'string' &&
    typeof userRecord.lastName === 'string' &&
    typeof userRecord.tenantId === 'string' &&
    [
      'CLIENT',
      'CLIENT_ADMIN',
      'SHAREHOLDER',
      'ADMIN',
      'SUPER_ADMIN',
      'PROJECT_MANAGER',
    ].includes(String(userRecord.role))
  );
}

const nextAuth: NextAuthResult = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  basePath: '/api/auth',
  providers: [
    ...(keycloakProvidersEnabled && clientKeycloakConfigured
      ? [
          {
            ...Keycloak(clientKeycloakOptions),
            id: clientProviderId,
            name: 'Client Realm',
          },
        ]
      : []),
    ...(keycloakProvidersEnabled && shareholderKeycloakConfigured
      ? [
          {
            ...Keycloak(shareholderKeycloakOptions),
            id: shareholderProviderId,
            name: 'Shareholder Realm',
          },
        ]
      : []),
    credentialsProvider,
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, account, profile, user }) {
      if (account?.provider === clientProviderId) {
        token.authProvider = account.provider;
        token.role = 'CLIENT';
        token.userRole = 'CLIENT';
        token.keycloakAccessToken = account.access_token ?? undefined;
        token.accessToken = account.access_token ?? undefined;
        token.accessTokenExpiresAt = account.expires_at;
        const tenantClaim = profile?.tenantId ?? profile?.tenant_id;
        token.tenantId =
          typeof tenantClaim === 'string' && tenantClaim.trim()
            ? tenantClaim
            : undefined;
      } else if (account?.provider === shareholderProviderId) {
        token.authProvider = account.provider;
        token.role = 'SHAREHOLDER';
        token.userRole = 'SHAREHOLDER';
        token.keycloakAccessToken = account.access_token ?? undefined;
        token.accessToken = account.access_token ?? undefined;
        token.accessTokenExpiresAt = account.expires_at;
        const tenantClaim = profile?.tenantId ?? profile?.tenant_id;
        token.tenantId =
          typeof tenantClaim === 'string' && tenantClaim.trim()
            ? tenantClaim
            : undefined;
      } else if (
        account?.provider === 'credentials' &&
        typeof user.role === 'string' &&
        typeof user.tenantId === 'string' &&
        typeof user.accessToken === 'string'
      ) {
        const role = user.role;
        token.authProvider = 'credentials';
        token.role = portalRole(role);
        token.userRole = role;
        token.tenantId = user.tenantId;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }) {
      if (
        token.authProvider === clientProviderId ||
        token.authProvider === shareholderProviderId ||
        token.authProvider === 'credentials'
      ) {
        session.authProvider = token.authProvider;
      }
      if (
        token.role === 'CLIENT' ||
        token.role === 'SHAREHOLDER' ||
        token.role === 'ADMIN'
      ) {
        session.role = token.role;
      }
      if (session.user && token.userRole) {
        session.user.role = token.userRole;
      }
      if (typeof token.tenantId === 'string') {
        session.tenantId = token.tenantId;
      }
      if (typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken;
      }

      return session;
    },
  },
});

export const auth: NextAuthResult['auth'] = nextAuth.auth;
export const handlers: NextAuthResult['handlers'] = nextAuth.handlers;
export const signIn: NextAuthResult['signIn'] = nextAuth.signIn;
export const signOut: NextAuthResult['signOut'] = nextAuth.signOut;
