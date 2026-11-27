import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Code2,
  GraduationCap,
  Headset,
  RadioTower,
  Sun,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { RevealSection } from "@/components/MotionReveal";

type ExpertisePageProps = {
  params: Promise<{ locale: string }>;
};

const sectors = [
  { key: "education", Icon: GraduationCap },
  { key: "itSupport", Icon: Headset },
  { key: "software", Icon: Code2 },
  { key: "telecom", Icon: RadioTower },
  { key: "solar", Icon: Sun },
  { key: "power", Icon: Zap },
] as const;

export default async function ExpertisePage({ params }: ExpertisePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, home] = await Promise.all([
    getTranslations({ locale, namespace: "Expertise" }),
    getTranslations({ locale, namespace: "Home" }),
  ]);

  return (
    <div className="bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <RevealSection className="relative isolate overflow-hidden bg-slate-50 px-6 py-20 text-slate-900 sm:px-8 sm:py-28 dark:bg-[#061426] dark:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_20%,rgba(11,74,139,0.14),transparent_44%),radial-gradient(ellipse_at_12%_100%,rgba(22,101,52,0.08),transparent_40%)] dark:bg-[radial-gradient(ellipse_at_78%_20%,rgba(11,74,139,0.55),transparent_44%),radial-gradient(ellipse_at_12%_100%,rgba(22,101,52,0.18),transparent_40%)]" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(11,74,139,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(11,74,139,.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-white/15 dark:bg-white/[0.07] dark:text-blue-100">
            <span className="size-1.5 rounded-full bg-[#f2b632]" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.06] tracking-[-0.045em] text-slate-900 sm:text-6xl dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-blue-50/75">
            {t("description")}
          </p>
          <Link
            href={`/${locale}/rfp`}
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
          >
            {home("partnerCta")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </RevealSection>

      <div className="bg-white dark:bg-slate-950">
        {sectors.map(({ key, Icon }, index) => (
          <RevealSection
            key={key}
            className={`relative isolate overflow-hidden border-b border-slate-200 last:border-0 ${
              index % 2 === 1
                ? "bg-slate-50/80 dark:bg-slate-900/70"
                : "bg-white dark:bg-slate-950"
            }`}
          >
            <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl items-center gap-10 px-6 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 select-none text-[clamp(10rem,28vw,26rem)] font-bold leading-none tracking-[-0.08em] text-slate-950/[0.035] dark:text-white/[0.04] ${
                  index % 2 === 1 ? "right-0" : "left-0"
                }`}
              >
                0{index + 1}
              </span>
              <div
                className={`relative z-10 max-w-xl ${
                  index % 2 === 1 ? "lg:order-2" : ""
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  {t("sectorLabel", { number: index + 1 })}
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                  {t(`sectors.${key}.title`)}
                </h2>
                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
                  {t(`sectors.${key}.description`)}
                </p>
              </div>
              <div
                className={`premium-card group relative flex min-h-[22rem] items-center justify-center overflow-hidden bg-gradient-to-br from-white to-blue-50 p-10 shadow-[0_28px_90px_rgba(2,6,23,0.08)] sm:min-h-[28rem] dark:border-white/10 dark:bg-slate-950 ${
                  index % 2 === 1 ? "lg:order-1" : ""
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(11,74,139,0.12),transparent_62%)]" />
                <div className="absolute -right-20 -top-20 size-64 rounded-full border border-brand-600/10 transition duration-700 group-hover:scale-110" />
                <div className="absolute -bottom-28 -left-20 size-80 rounded-full border border-blue-100 transition duration-700 group-hover:scale-110" />
                <div className="relative flex size-36 items-center justify-center rounded-[2rem] border border-blue-200 bg-brand-50 text-brand-600 shadow-[0_0_80px_rgba(37,99,235,0.12)] backdrop-blur-xl transition duration-500 group-hover:scale-105 sm:size-44 dark:border-blue-100/20 dark:bg-white/[0.06] dark:text-cyan-200">
                  <Icon
                    size={60}
                    strokeWidth={1.25}
                    aria-hidden="true"
                    className="sm:size-[72px]"
                  />
                </div>
                <div className="absolute bottom-6 left-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:bottom-8 sm:left-8">
                  PrimeHorizon <span className="px-2 text-brand-500">/</span>{" "}
                  0{index + 1}
                </div>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </div>
  );
}
