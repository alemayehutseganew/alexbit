import { auth } from "@/auth";
import Link from "next/link";
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
      tone: "bg-sky-100 text-sky-700",
    },
    {
      label: t("totalSharesIssued"),
      value: totalShares.toLocaleString(locale === "am" ? "am-ET" : "en-ET"),
      Icon: Landmark,
      tone: "bg-indigo-100 text-indigo-700",
    },
    {
      label: t("totalCapitalRaised"),
      value: formatCurrency(totalCapital, locale),
      Icon: Wallet,
      tone: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-8 lg:space-y-10">
      <section
        id="overview"
        className="relative isolate scroll-mt-28 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-800 to-blue-900 p-6 text-white shadow-2xl shadow-blue-950/15 sm:p-8 lg:p-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-32 size-96 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 right-1/4 size-72 rounded-full bg-cyan-300/10 blur-3xl"
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" />
              {t("portalName")}
            </p>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("welcome", { name })}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              {t("description")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/shareholder#cap-table`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              >
                <Landmark aria-hidden="true" size={17} />
                {t("capTable")}
              </Link>
              <Link
                href={`/${locale}/shareholder/kyc-documents`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                <Users aria-hidden="true" size={17} />
                {t("kycDocuments")}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-slate-950/25 p-5 shadow-inner backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">
                {t("totalShareholders")}
              </p>
              <Users aria-hidden="true" className="text-cyan-200" size={18} />
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums">
              {shareholders.length.toLocaleString(
                locale === "am" ? "am-ET" : "en-ET",
              )}
            </p>
            <p className="mt-2 text-xs text-blue-100">{t("capTableMetrics")}</p>
          </div>
        </div>
      </section>

      <section
        id="my-holdings"
        aria-label={t("holdings")}
        className="grid scroll-mt-28 gap-4 md:grid-cols-3 lg:gap-5"
      >
        {statCards.map(({ label, value, Icon, tone }) => (
          <article
            key={label}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/[0.035] transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-6"
          >
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-8 size-28 rounded-full bg-slate-50 transition-transform group-hover:scale-125"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </p>
                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {value}
                </p>
              </div>
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tone}`}
              >
                <Icon aria-hidden="true" size={20} />
              </span>
            </div>
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
