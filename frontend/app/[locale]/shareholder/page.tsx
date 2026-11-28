import { auth } from "@/auth";
import ShareholderRecordsManager from "./ShareholderRecordsManager";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Landmark, Users, Wallet } from "lucide-react";

type ShareholderRecord = {
  id: string;
  contactNo: string | null;
  tinNumber: string | null;
  numberOfShares: number;
  shareValue: string | number;
  totalContribution: string | number;
  datePaid: string | null;
  remarks: string | null;
  shareClass: string;
  isAccredited: boolean;
  kycStatus: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  tenant: { id: string; name: string };
};

type ShareholderPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string | string[] }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isShareholder(value: unknown): value is ShareholderRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (typeof value.contactNo === "string" || value.contactNo === null) &&
    (typeof value.tinNumber === "string" || value.tinNumber === null) &&
    typeof value.numberOfShares === "number" &&
    Number.isFinite(value.numberOfShares) &&
    (typeof value.shareValue === "string" ||
      typeof value.shareValue === "number") &&
    Number.isFinite(Number(value.shareValue)) &&
    (typeof value.totalContribution === "string" ||
      typeof value.totalContribution === "number") &&
    Number.isFinite(Number(value.totalContribution)) &&
    (typeof value.datePaid === "string" || value.datePaid === null) &&
    (typeof value.remarks === "string" || value.remarks === null) &&
    typeof value.shareClass === "string" &&
    typeof value.isAccredited === "boolean" &&
    ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(
      String(value.kycStatus),
    ) &&
    isRecord(value.tenant) &&
    typeof value.tenant.id === "string" &&
    typeof value.tenant.name === "string"
  );
}

function formatCurrency(value: number, locale: string): string {
  const formattedAmount = new Intl.NumberFormat(
    locale === "am" ? "am-ET" : "en-ET",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);

  return `ETB ${formattedAmount}`;
}

export default async function ShareholderOverview({
  params,
  searchParams,
}: ShareholderPageProps) {
  const [{ locale }, searchParamsValue] = await Promise.all([
    params,
    searchParams,
  ]);
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    auth(),
    getTranslations({ locale, namespace: "ShareholderPortal" }),
  ]);
  if (
    !session ||
    ![
      "SHAREHOLDER",
      "SHAREHOLDER_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
      "PROJECT_MANAGER",
    ].includes(session.role ?? "") ||
    !session.accessToken ||
    !session.tenantId
  ) {
    redirect(`/${locale}/login`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/shareholder/all`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load shareholders (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isShareholder)) {
    throw new Error("The shareholder API returned invalid data.");
  }

  const shareholders = data;
  const totalShares = shareholders.reduce(
    (sum, shareholder) => sum + shareholder.numberOfShares,
    0,
  );
  const totalCapital = shareholders.reduce(
    (sum, shareholder) => sum + Number(shareholder.totalContribution),
    0,
  );
  const search =
    (Array.isArray(searchParamsValue.search)
      ? searchParamsValue.search[0]
      : searchParamsValue.search
    )?.trim() ?? "";
  const name = session.user?.name?.trim() || t("shareholderFallback");

  const statCards = [
    {
      label: t("totalShareholders"),
      value: shareholders.length.toLocaleString(
        locale === "am" ? "am-ET" : "en-ET",
      ),
      Icon: Users,
    },
    {
      label: t("totalSharesIssued"),
      value: totalShares.toLocaleString(locale === "am" ? "am-ET" : "en-ET"),
      Icon: Landmark,
    },
    {
      label: t("totalCapitalRaised"),
      value: formatCurrency(totalCapital, locale),
      Icon: Wallet,
    },
  ];

  return (
    <div className="space-y-8">
      <section
        id="overview"
        className="scroll-mt-28 rounded-3xl border border-blue-100 bg-[radial-gradient(ellipse_at_85%_15%,rgba(59,130,246,0.14),transparent_45%),linear-gradient(135deg,#eff6ff,#fff_55%,#f8fafc)] px-5 py-6 shadow-xl shadow-brand-900/5 sm:px-7"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          {t("portalName")}
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {t("welcome", { name })}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {t("description")}
        </p>
      </section>

      <section
        id="my-holdings"
        aria-label={t("holdings")}
        className="grid scroll-mt-28 gap-6 md:grid-cols-3"
      >
        {statCards.map(({ label, value, Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <Icon aria-hidden="true" className="text-brand-600" size={20} />
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <ShareholderRecordsManager
        initialShareholders={shareholders}
        accessToken={session.accessToken}
        role={session.user?.role ?? session.role ?? ""}
        locale={locale}
        initialSearch={search}
      />
    </div>
  );
}
