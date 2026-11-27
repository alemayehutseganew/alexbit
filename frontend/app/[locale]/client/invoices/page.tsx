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

  let invoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    amount: string | number;
    status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  }> = [];
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/client/invoices`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (response.ok) {
      const value: unknown = await response.json();
      if (
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "id" in item &&
            "invoiceNumber" in item &&
            "issueDate" in item &&
            "amount" in item &&
            "status" in item,
        )
      ) {
        invoices = value as typeof invoices;
      }
    }
  } catch {
    invoices = [];
  }

  return (
    <div className="min-h-screen p-6">
      <section className="premium-card overflow-hidden p-0">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          {t("invoices")}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
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
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-200 bg-white hover:bg-slate-50"
                >
                  <td className="p-6 whitespace-nowrap">
                    <p className="text-sm font-medium text-slate-900">
                      {invoice.invoiceNumber}
                    </p>
                  </td>
                  <td className="p-6 whitespace-nowrap">
                    <p className="text-sm text-slate-500">
                      {new Intl.DateTimeFormat(
                        locale === "am" ? "am-ET" : "en-ET",
                        { dateStyle: "medium" },
                      ).format(new Date(invoice.issueDate))}
                    </p>
                  </td>
                  <td className="p-6 whitespace-nowrap">
                    <p className="text-xl font-semibold text-brand-600">
                      ETB {Number(invoice.amount).toLocaleString(
                        locale === "am" ? "am-ET" : "en-ET",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </p>
                  </td>
                  <td className="p-6 whitespace-nowrap">
                    <span className="rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                      {t(`invoiceStatus.${invoice.status}`)}
                    </span>
                  </td>
                  <td className="p-6 whitespace-nowrap">
                    <span className="text-sm text-slate-500">
                      {t("viewDetails")}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    {t("noInvoicesText")}
                  </td>
                </tr>
              )}
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
