import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, MapPin, Users, Globe2 } from "lucide-react";
import { ExpertiseGrid } from "@/components/brand/ExpertiseGrid";
import { HeroGraphic } from "@/components/brand/HeroGraphic";
import { TrustMarquee } from "@/components/brand/TrustMarquee";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { PulseOrb, RevealCard } from "@/components/MotionReveal";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

const sectorIcons = [
  "education",
  "itSupport",
  "software",
  "telecom",
  "solar",
  "power",
] as const;

const credibilityCards = [
  { key: "localRoots", Icon: MapPin, size: "md:col-span-2" },
  { key: "globalEducation", Icon: Globe2, size: "" },
  { key: "agileTeam", Icon: Users, size: "md:col-span-3" },
] as const;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });

  const stats = [
    { value: 20, suffix: "+", label: t("stats.experts") },
    { value: 6, suffix: "", label: t("stats.sectors") },
    { value: 4, suffix: "", label: t("stats.institutions") },
    { value: 100, suffix: "%", label: t("stats.commitment") },
  ];

  const sectors = sectorIcons.map((key) => ({
    icon: key,
    title: t(`sectors.${key}.title`),
    description: t(`sectors.${key}.description`),
  }));

  return (
    <div className="overflow-hidden bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="relative isolate min-h-[680px] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-slate-50 dark:bg-slate-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_55%_20%,rgba(11,74,139,0.13),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_55%_20%,rgba(11,74,139,0.42),transparent_58%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.09] dark:opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(71,85,105,.24) 1px, transparent 1px), linear-gradient(90deg, rgba(71,85,105,.24) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to bottom, black, transparent 92%)",
          }}
        />
        <PulseOrb className="absolute -right-36 top-24 -z-10 size-[30rem] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-6 py-24 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative z-10 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:border-blue-300/20 dark:bg-blue-300/[0.08] dark:text-blue-200">
              <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
              {t("eyebrow")}
            </p>
            <h1 className="mt-7 text-4xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              {t("headline")}
              <span className="mt-2 block bg-gradient-to-r from-brand-600 via-cyan-600 to-slate-700 bg-clip-text text-transparent dark:from-blue-300 dark:via-cyan-200 dark:to-white">
                {t("headlineAccent")}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              {t("description")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/rfp`}
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                {t("partnerCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/expertise`}
                className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:border-blue-300/50 dark:hover:bg-white/[0.08]"
              >
                {t("expertiseCta")}
              </Link>
            </div>
            <div className="mt-12 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
              {t("heroExpertiseLine")}
            </div>
          </div>

          <HeroGraphic
            orbitLabel={t("orbitLabel")}
            labels={sectorIcons.map((key) => t(`sectors.${key}.title`))}
          />
        </div>
      </section>

      <TrustMarquee
        label={t("trustedBy")}
        partners={["EEP", "CBE", "Ethio Telecom", "INSA"]}
      />

      <section className="border-y border-slate-200 bg-slate-50 transition-colors dark:border-white/10 dark:bg-slate-900/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/10 px-6 sm:px-8 md:grid-cols-4 md:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-5 py-8 text-center sm:py-10">
              <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-24 transition-colors sm:px-8 sm:py-28 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-blue-300">
              {t("credibilityEyebrow")}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("credibilityTitle")}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {credibilityCards.map(({ key, Icon, size }, index) => (
              <RevealCard
                key={key}
                delay={index * 0.08}
                className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-7 backdrop-blur-md transition hover:border-blue-400/50 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.07] ${size}`}
              >
                <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-600/10 blur-3xl transition group-hover:bg-brand-600/25" />
                <Icon
                  className="relative size-6 text-brand-600 dark:text-blue-300"
                  aria-hidden="true"
                />
                <h3 className="relative mt-6 text-xl font-semibold">
                  {t(`credibility.${key}.title`)}
                </h3>
                <p className="relative mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {t(`credibility.${key}.description`)}
                </p>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      <ExpertiseGrid
        eyebrow={t("sectorsEyebrow")}
        title={t("sectorsTitle")}
        linkHref={`/${locale}/expertise`}
        linkLabel={t("allExpertise")}
        items={sectors}
      />

      <section className="bg-white px-6 py-24 transition-colors sm:px-8 sm:py-28 dark:bg-slate-950">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-7 py-14 text-center shadow-2xl shadow-blue-950/10 sm:px-14 sm:py-20 dark:border-blue-300/20 dark:from-brand-600/35 dark:via-slate-900 dark:to-slate-950 dark:shadow-blue-950/30">
          <div className="absolute -right-12 -top-32 size-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <h2 className="relative mx-auto max-w-3xl text-2xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {t("closingTitle")}
          </h2>
          <Link
            href={`/${locale}/contact`}
            className="relative mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:bg-white dark:text-brand-600 dark:hover:bg-blue-50"
          >
            {t("closingCta")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
