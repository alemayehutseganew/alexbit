import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, MapPin, Users, Globe2 } from "lucide-react";
import { ExpertiseGrid } from "@/components/brand/ExpertiseGrid";
import { HeroGraphic } from "@/components/brand/HeroGraphic";
import { TrustMarquee } from "@/components/brand/TrustMarquee";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  PulseOrb,
  RevealCard,
  RevealSection,
  StaggeredReveal,
} from "@/components/MotionReveal";

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
      <section className="relative isolate min-h-[700px] overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#061426] dark:text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_24%,rgba(11,74,139,0.14),transparent_44%),radial-gradient(ellipse_at_15%_90%,rgba(22,101,52,0.08),transparent_40%)] dark:bg-[radial-gradient(ellipse_at_75%_24%,rgba(11,74,139,0.58),transparent_44%),radial-gradient(ellipse_at_15%_90%,rgba(22,101,52,0.18),transparent_40%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.06] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(11,74,139,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(11,74,139,.18) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black, transparent 92%)",
          }}
        />
        <PulseOrb className="absolute -right-36 top-24 -z-10 size-[30rem] rounded-full bg-cyan-400/15 blur-[120px]" />
        <div className="mx-auto grid min-h-[700px] max-w-7xl items-center gap-10 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr]">
          <StaggeredReveal className="relative z-10 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/[0.07] dark:text-blue-100">
              <span className="size-1.5 rounded-full bg-[#f2b632] shadow-[0_0_12px_rgba(242,182,50,.8)]" />
              {t("eyebrow")}
            </p>
            <h1 className="mt-7 text-4xl font-bold leading-[1.04] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem] dark:text-white">
              {t("headline")}
              <span className="mt-2 block bg-gradient-to-r from-brand-600 to-blue-400 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                {t("headlineAccent")}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-blue-50/80">
              {t("description")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/rfp`}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-950/30 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
              >
                {t("partnerCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/expertise`}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur transition-all duration-300 hover:border-brand-300 hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:border-white/20 dark:bg-white/[0.06] dark:text-white dark:hover:border-cyan-200/60 dark:hover:bg-white/[0.12]"
              >
                {t("expertiseCta")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-blue-100/75">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              {t("heroExpertiseLine")}
            </div>
          </StaggeredReveal>

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

      <RevealSection className="border-y border-slate-200 bg-white text-slate-900 dark:border-blue-950/10 dark:bg-[#071b32] dark:text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-6 sm:px-8 md:grid-cols-4 md:divide-y-0 dark:divide-white/10">
          {stats.map((stat) => (
            <div key={stat.label} className="px-5 py-8 text-center sm:py-10">
              <p className="text-3xl font-bold tracking-tight text-brand-600 sm:text-4xl dark:text-white">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-blue-100/65">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </RevealSection>

      <section className="bg-slate-50 px-6 py-24 transition-colors sm:px-8 sm:py-28 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-blue-300">
              <span className="h-px w-8 bg-[#d49a16]" aria-hidden="true" />
              {t("credibilityEyebrow")}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {t("credibilityTitle")}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {credibilityCards.map(({ key, Icon, size }, index) => (
              <RevealCard
                key={key}
                delay={index * 0.08}
                className={`premium-card group relative overflow-hidden p-8 backdrop-blur-md hover:-translate-y-1 hover:border-blue-300 ${size}`}
              >
                <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-600/10 blur-3xl transition group-hover:bg-emerald-500/15" />
                <Icon
                  className="relative size-6 text-brand-600 dark:text-blue-300"
                  aria-hidden="true"
                />
                <h3 className="relative mt-6 text-xl font-semibold text-slate-900 dark:text-white">
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

      <RevealSection className="bg-white px-6 py-24 transition-colors sm:px-8 sm:py-28 dark:bg-slate-950">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-7 py-14 text-center text-slate-900 shadow-xl shadow-brand-900/5 sm:px-14 sm:py-20 dark:border-blue-950/10 dark:bg-[#061426] dark:text-white">
          <div className="absolute -right-12 -top-32 size-72 rounded-full bg-brand-300/20 blur-3xl" />
          <div className="absolute -bottom-36 -left-12 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <h2 className="relative mx-auto max-w-3xl text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("closingTitle")}
          </h2>
          <Link
            href={`/${locale}/contact`}
            className="relative mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
          >
            {t("closingCta")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </RevealSection>
    </div>
  );
}
