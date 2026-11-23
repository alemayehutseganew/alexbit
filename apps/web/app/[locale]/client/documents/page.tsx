import { auth } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          {t("documentVault")}
        </h2>

        <div className="border rounded-xl p-8 text-center border-dashed border-slate-400 hover:border-brand-600 cursor-pointer mb-8">
          <div className="h-24 w-full flex items-center justify-center">
            <svg
              className="h-12 w-12 text-slate-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line points="12 3 12 15" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-slate-500">{t("dragAndDropFiles")}</p>
        </div>

        <div>
          <p className="text-sm text-slate-600 mb-4">
            {t("noDocumentsUploadedYet")}
          </p>
          <p className="text-sm text-slate-500">{t("uploadDocumentsHint")}</p>
        </div>
      </section>
    </div>
  );
}
