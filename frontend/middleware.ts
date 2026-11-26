import { auth, shareholderKeycloakConfigured } from "./auth";
import createMiddleware from "next-intl/middleware";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import type { NextAuthRequest } from "next-auth";

const intlMiddleware = createMiddleware({
  locales: ["en", "am"],
  defaultLocale: "en",
});

type Portal = "admin" | "client" | "shareholder";

function portalForPath(pathname: string): Portal | null {
  const match = pathname.match(
    /^\/(?:(?:en|am)\/)?(admin|client|shareholder)(?:\/|$)/,
  );
  return match?.[1] === "admin" ||
    match?.[1] === "client" ||
    match?.[1] === "shareholder"
    ? match[1]
    : null;
}

function localeForRequest(request: NextRequest) {
  return request.nextUrl.pathname.match(/^\/(en|am)(?:\/|$)/)?.[1] ?? "en";
}

function redirectToLogin(request: NextRequest, portal: Portal) {
  const locale = localeForRequest(request);
  const loginUrl = new URL(`/${locale}/login`, request.url);
  if (portal !== "admin") {
    loginUrl.searchParams.set("realm", portal);
  }
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

function portalForRole(role: string | undefined): Portal | null {
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROJECT_MANAGER") {
    return "admin";
  }
  if (role === "CLIENT") {
    return "client";
  }
  if (role === "SHAREHOLDER") {
    return "shareholder";
  }
  return null;
}

const protectClientRoute = auth(
  (request: NextAuthRequest, _event: NextFetchEvent) => {
    const portal = portalForPath(request.nextUrl.pathname);
    if (!portal || !request.auth?.user) {
      return redirectToLogin(request, portal ?? "client");
    }

    const userPortal = portalForRole(request.auth.role);
    const isAdmin = userPortal === "admin";
    const isAuthorized =
      isAdmin ||
      (portal === "client" && userPortal === "client") ||
      (portal === "shareholder" && userPortal === "shareholder");

    if (!isAuthorized) {
      return redirectToLogin(request, portal);
    }

    return intlMiddleware(request);
  },
);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const portal = portalForPath(request.nextUrl.pathname);
  if (portal) {
    const credentialsEnabled =
      process.env.NODE_ENV !== "production" ||
      Boolean(process.env.AUTH_SECRET);
    const providerConfigured =
      portal === "admin" ||
      portal === "client" ||
      shareholderKeycloakConfigured ||
      credentialsEnabled;
    if (!process.env.AUTH_SECRET || !providerConfigured) {
      return redirectToLogin(request, portal);
    }

    return protectClientRoute(request, event);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
