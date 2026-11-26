import { auth } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";
import { ShareholderCapTable } from "./ShareholderCapTable";

type ShareholderPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ShareholderPage({
  params,
}: ShareholderPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    auth(),
    getTranslations({ locale, namespace: "ShareholderPortal" }),
  ]);
  if (
    !session ||
    !["SHAREHOLDER", "ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"].includes(
      session.role ?? "",
    ) ||
    !session.accessToken ||
    !session.tenantId
  ) {
    redirect(`/${locale}/login`);
  }

  const name = session.user?.name?.trim() || t("shareholderFallback");

  return (
    <div className="space-y-8">
      <section
        id="overview"
        className="scroll-mt-28 overflow-hidden rounded-3xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(30,64,175,0.18),rgba(15,23,42,0.92)_55%,rgba(8,145,178,0.08))] px-5 py-6 shadow-2xl shadow-black/10 sm:px-7"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              {t("portalName")}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-4xl">
              {t("welcome", { name })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              {t("description")}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-200 shadow-[0_0_30px_rgba(52,211,153,0.06)]">
            <ShieldCheck aria-hidden="true" size={15} />
            {t("secureAccount")}
          </span>
        </div>
      </section>

      <ShareholderCapTable
        accessToken={session.accessToken}
        locale={locale}
        tenantId={session.tenantId}
        canManage={["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"].includes(
          session.user?.role ?? session.role ?? "",
        )}
      />

      <section className="grid gap-6 xl:grid-cols-5">
        <article
          id="my-holdings"
          className="scroll-mt-28 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 xl:col-span-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-white">
                {t("equityDistribution")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {t("distributionDescription")}
              </p>
            </div>
            <ChartNoAxesCombined
              aria-hidden="true"
              className="text-blue-300"
              size={20}
            />
          </div>
          <div className="mt-7 flex h-4 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full w-full bg-brand-600" />
          </div>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
              {t("ordinaryShares")}
            </span>
            <span className="font-medium text-white">100%</span>
          </div>
        </article>

        <article
          id="governance"
          className="scroll-mt-28 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 xl:col-span-3"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-white">
              {t("governanceUpdates")}
            </h2>
            <ArrowUpRight
              aria-hidden="true"
              size={18}
              className="text-slate-400"
            />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">{t("updateDate")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("updateType")}</th>
                  <th className="pb-3 font-medium">{t("updateDetails")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-4 pr-4 text-slate-400">
                    {t("annualMeetingDate")}
                  </td>
                  <td className="py-4 pr-4 font-medium text-white">
                    {t("annualMeeting")}
                  </td>
                  <td className="py-4 leading-6 text-slate-400">
                    {t("annualMeetingDetails")}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 pr-4 text-slate-400">
                    {t("kycReviewDate")}
                  </td>
                  <td className="py-4 pr-4 font-medium text-white">
                    {t("kycReview")}
                  </td>
                  <td className="py-4 leading-6 text-slate-400">
                    {t("kycReviewDetails")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section
        id="kyc-documents"
        className="scroll-mt-28 rounded-2xl border border-blue-300/15 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(15,23,42,0.5))] p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">{t("documentsTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {t("documentsDescription")}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-medium text-amber-100">
            <BadgeCheck aria-hidden="true" size={14} />
            {t("kycDocuments")}
          </span>
        </div>
      </section>
    </div>
  );
}
