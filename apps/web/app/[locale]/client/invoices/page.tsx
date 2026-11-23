import { auth } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

type ClientInvoicesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ClientInvoicesPage({
  params,
}: ClientInvoicesPageProps) {
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
          {t("invoices")}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">
                  {t("invoiceNumber")}
                </th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">
                  {t("date")}
                </th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">
                  {t("amount")}
                </th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">
                  {t("status")}
                </th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b border-slate-200">
                <td className="p-6 whitespace-nowrap">
                  <p className="text-sm font-medium text-slate-900">
                    INV-2026-001
                  </p>
                </td>
                <td className="p-6 whitespace-nowrap">
                  <p className="text-sm text-slate-500">Nov 15, 2026</p>
                </td>
                <td className="p-6 whitespace-nowrap">
                  <p className="text-xl font-semibold text-brand-600">
                    $2,500.00
                  </p>
                </td>
                <td className="p-6 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Pending
                  </span>
                </td>
                <td className="p-6 whitespace-nowrap">
                  <button className="text-sm font-medium text-brand-600 hover:underline">
                    {t("viewDetails")}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8">
        <p className="text-sm text-slate-500">{t("noInvoicesText")}</p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 transition-colors">
          {t("createInvoice")}
        </button>
      </div>
    </div>
  );
}
