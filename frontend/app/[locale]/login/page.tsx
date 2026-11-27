import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginBranding } from "./LoginBranding";
import { LoginActions } from "./LoginActions";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    callbackUrl?: string;
    realm?: string;
    role?: string;
  }>;
};

function isLocalPortalCallback(
  callbackUrl: string | undefined,
  locale: string,
  portal: "admin" | "client" | "shareholder",
): callbackUrl is string {
  return (
    callbackUrl === `/${locale}/${portal}` ||
    callbackUrl?.startsWith(`/${locale}/${portal}/`) === true ||
    callbackUrl === `/${portal}` ||
    callbackUrl?.startsWith(`/${portal}/`) === true
  );
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const [{ locale }, query] = await Promise.all([
    params,
    searchParams ??
      Promise.resolve<{
        callbackUrl?: string;
        realm?: string;
        role?: string;
      }>({}),
  ]);
  setRequestLocale(locale);

  const [brand, t] = await Promise.all([
    getTranslations({ locale, namespace: "Brand" }),
    getTranslations({ locale, namespace: "Login" }),
  ]);
  const clientCallbackUrl = isLocalPortalCallback(
    query.callbackUrl,
    locale,
    "client",
  )
    ? query.callbackUrl
    : `/${locale}/client`;
  const shareholderCallbackUrl = isLocalPortalCallback(
    query.callbackUrl,
    locale,
    "shareholder",
  )
    ? query.callbackUrl
    : `/${locale}/shareholder`;
  const adminCallbackUrl = isLocalPortalCallback(
    query.callbackUrl,
    locale,
    "admin",
  )
    ? query.callbackUrl
    : `/${locale}/admin`;
  const requestedRealm = query.role ?? query.realm;
  const preferredRealm =
    requestedRealm === "client" || requestedRealm === "shareholder"
      ? requestedRealm
      : null;
  const shareholderConfigured = Boolean(
    process.env.AUTH_KEYCLOAK_SHAREHOLDER_ID &&
    process.env.AUTH_KEYCLOAK_SHAREHOLDER_SECRET &&
    process.env.AUTH_KEYCLOAK_SHAREHOLDER_ISSUER,
  );
  const credentialsEnabled = process.env.NODE_ENV !== "production";

  return (
    <div className="grid min-h-screen w-full overflow-hidden bg-slate-50 pt-32 transition-colors md:grid-cols-2 dark:bg-slate-950">
      <section className="relative hidden min-h-[calc(100vh-8rem)] flex-col overflow-hidden bg-gradient-to-br from-brand-900 via-blue-900 to-slate-950 px-8 py-10 text-white md:flex sm:px-12 lg:px-16 lg:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/50 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-[120px]"
        />
        <LoginBranding
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          companyNameEn={brand("nameEn")}
          companyNameAm={brand("nameAm")}
          phone={brand("phone")}
        />
      </section>

      <section className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center bg-slate-50 px-0 py-0 dark:bg-slate-950 md:px-8 md:py-10 lg:px-14">
        <div className="flex w-full items-center justify-center">
          <LoginActions
            clientCallbackUrl={clientCallbackUrl}
            shareholderCallbackUrl={shareholderCallbackUrl}
            adminCallbackUrl={adminCallbackUrl}
            shareholderConfigured={shareholderConfigured}
            credentialsEnabled={credentialsEnabled}
            preferredRealm={preferredRealm}
          />
        </div>
      </section>
    </div>
  );
}
