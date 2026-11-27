import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  Lightbulb,
  MapPin,
  Users,
} from "lucide-react";
import { RevealCard } from "@/components/MotionReveal";
import { BrandLogo } from "@/components/brand/BrandLogo";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

const values = [
  { key: "local", Icon: MapPin },
  { key: "global", Icon: Globe2 },
  { key: "innovation", Icon: Lightbulb },
] as const;

const milestones = ["foundation", "collective", "horizon"] as const;

const nodes = Array.from({ length: 20 }, (_, index) => ({
  left: `${50 + 42 * Math.cos((index / 20) * Math.PI * 2)}%`,
  top: `${50 + 42 * Math.sin((index / 20) * Math.PI * 2)}%`,
  delay: index * 0.045,
}));

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, home] = await Promise.all([
    getTranslations({ locale, namespace: "About" }),
    getTranslations({ locale, namespace: "Home" }),
  ]);

  return (
    <div className="bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="relative isolate overflow-hidden bg-[#061426] px-6 py-20 text-white sm:px-8 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_22%,rgba(11,74,139,0.55),transparent_42%),radial-gradient(ellipse_at_18%_100%,rgba(22,101,52,0.2),transparent_40%)]" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
              <span className="size-1.5 rounded-full bg-[#f2b632]" aria-hidden="true" />
              {t("eyebrow")}
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-blue-50/75 sm:text-lg">
              {t("description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/contact`}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
              >
                {home("closingCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/expertise`}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-200/60 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
              >
                {home("expertiseCta")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[460px] items-center justify-center">
            <div className="absolute inset-[6%] rounded-full border border-white/10" />
            <div className="absolute inset-[18%] animate-[spin_72s_linear_infinite] rounded-full border border-dashed border-cyan-200/20" />
            <div className="absolute inset-[30%] rounded-full border border-white/10" />
            <div className="absolute size-56 rounded-full bg-brand-600/20 blur-[80px]" />
            <div className="relative flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <BrandLogo
                alt=""
                priority
                className="size-40 rounded-2xl bg-white object-contain p-1 shadow-lg sm:size-48"
              />
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100">
                {t("teamSize")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-20 sm:px-8 md:grid-cols-2 md:py-24">
        {(["mission", "vision"] as const).map((value) => (
          <article
            key={value}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-8 shadow-[0_18px_55px_rgba(7,27,50,0.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_26px_65px_rgba(7,27,50,0.11)] sm:p-10 dark:border-white/10 dark:from-slate-900 dark:to-slate-950"
          >
            <span className="absolute -right-12 -top-12 size-40 rounded-full bg-brand-600/5 blur-3xl transition group-hover:bg-emerald-500/10" />
            <span className="relative text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              {t(`${value}.eyebrow`)}
            </span>
            <h2 className="relative mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t(`${value}.title`)}
            </h2>
            <p className="relative mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
              {t(`${value}.description`)}
            </p>
          </article>
        ))}
      </section>

      <section className="relative isolate overflow-hidden bg-[#061426] px-6 py-20 text-white sm:px-8 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_50%,rgba(11,74,139,0.36),transparent_42%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              <span className="h-px w-8 bg-[#d49a16]" aria-hidden="true" />
              {t("syndicateEyebrow")}
            </p>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("syndicateTitle")}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
              {t("syndicateDescription")}
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-lg shadow-black/10 backdrop-blur">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600/25 text-blue-200">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold">{t("teamSize")}</span>
              <ArrowUpRight
                className="size-4 text-slate-400"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[420px]">
            <div className="absolute inset-[8%] rounded-full border border-blue-300/15" />
            <div className="absolute inset-[20%] animate-[spin_80s_linear_infinite] rounded-full border border-dashed border-cyan-200/20" />
            <div className="absolute inset-[32%] rounded-full border border-blue-300/20" />
            <div className="absolute inset-[44%] rounded-full border border-blue-300/20" />
            <BrandLogo
              alt=""
              priority
              className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-blue-100/30 bg-white object-contain p-0.5 shadow-[0_0_60px_rgba(37,99,235,0.3)]"
            />
            {nodes.map((node, index) => (
              <span
                key={index}
                className="absolute size-2.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]"
                style={{
                  left: node.left,
                  top: node.top,
                  animationDelay: `${node.delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            <span className="h-px w-8 bg-[#d49a16]" aria-hidden="true" />
            {t("valuesEyebrow")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("valuesTitle")}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {values.map(({ key, Icon }, index) => (
            <RevealCard
              key={key}
              delay={index * 0.1}
              tilt
              className="group h-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_16px_50px_rgba(7,27,50,0.06)] transition duration-300 hover:border-blue-200 hover:shadow-[0_26px_65px_rgba(7,27,50,0.12)] dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Icon size={21} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                {t(`values.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(`values.${key}.description`)}
              </p>
            </RevealCard>
          ))}
        </div>
      </section>

      <section className="overflow-hidden bg-[#071b32] px-6 py-20 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <span className="h-px w-8 bg-[#d49a16]" aria-hidden="true" />
            {t("timelineEyebrow")}
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("timelineTitle")}
          </h2>
          <div className="relative mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-blue-400/0 via-cyan-200/40 to-blue-400/0 md:block"
            />
            {milestones.map((key, index) => (
              <RevealCard
                key={key}
                delay={index * 0.12}
                className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <span className="relative z-10 flex size-10 items-center justify-center rounded-xl border border-cyan-200/20 bg-brand-600/20 text-xs font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                  0{index + 1}
                </span>
                <h3 className="mt-6 text-lg font-semibold">
                  {t(`journey.${key}.title`)}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300/75">
                  {t(`journey.${key}.description`)}
                </p>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8fb] px-6 py-20 sm:px-8 sm:py-24 dark:bg-slate-950">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#061426] px-7 py-12 text-center text-white shadow-[0_30px_90px_rgba(7,27,50,0.2)] sm:px-14 sm:py-16">
          <div className="absolute -right-12 -top-32 size-72 rounded-full bg-cyan-300/15 blur-3xl" />
          <h2 className="relative mx-auto max-w-3xl text-2xl font-semibold tracking-tight sm:text-4xl">
            {home("closingTitle")}
          </h2>
          <Link
            href={`/${locale}/contact`}
            className="relative mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
          >
            {home("closingCta")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
