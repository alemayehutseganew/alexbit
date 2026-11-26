import { auth } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ClientDocuments } from "./ClientDocuments";

type ClientDocumentsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ClientDocumentsPage({
  params,
}: ClientDocumentsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    auth(),
    getTranslations({ locale, namespace: "ClientPortal" }),
  ]);
  const actualRole = session?.user?.role ?? session?.role;
  if (
    ![
      "CLIENT",
      "CLIENT_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
      "PROJECT_MANAGER",
    ].includes(actualRole ?? "") ||
    !session?.tenantId
  ) {
    redirect(`/${locale}/login?realm=client`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const accessToken = session.accessToken;
  if (!accessToken) {
    throw new Error("An API access token is not available in this session");
  }

  return (
    <ClientDocuments
      apiUrl={apiUrl}
      accessToken={accessToken}
      locale={locale}
      title={t("documentVault")}
      hint={t("uploadDocumentsHint")}
    />
  );
}
