import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight, Globe2, Lightbulb, MapPin, Users } from "lucide-react";
import { RevealCard } from "@/components/MotionReveal";

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
  const t = await getTranslations({ locale, namespace: "About" });

  return (
    <div className="bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white sm:px-8 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(11,74,139,0.36),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            {t("eyebrow")}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-20 sm:px-8 md:grid-cols-2 md:py-24">
        {(["mission", "vision"] as const).map((value) => (
          <article
            key={value}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-8 transition-colors sm:p-10 dark:border-white/10 dark:bg-slate-900"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              {t(`${value}.eyebrow`)}
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t(`${value}.title`)}
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
              {t(`${value}.description`)}
            </p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden bg-slate-950 px-6 py-20 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              {t("syndicateEyebrow")}
            </p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("syndicateTitle")}
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-300">
              {t("syndicateDescription")}
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <Users className="size-5 text-blue-300" aria-hidden="true" />
              <span className="text-sm font-semibold">{t("teamSize")}</span>
              <ArrowUpRight
                className="size-4 text-slate-400"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[420px]">
            <div className="absolute inset-[14%] rounded-full border border-blue-300/20" />
            <div className="absolute inset-[28%] rounded-full border border-blue-300/20" />
            <div className="absolute inset-[42%] rounded-full border border-blue-300/20" />
            <div className="absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-blue-200/20 bg-brand-600/35 text-xl font-bold shadow-[0_0_60px_rgba(37,99,235,0.3)]">
              PH
            </div>
            {nodes.map((node, index) => (
              <span
                key={index}
                className="absolute size-2.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]"
                style={{ left: node.left, top: node.top }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
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
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_rgba(15,23,42,0.07)] transition-colors dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
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

      <section className="overflow-hidden bg-slate-950 px-6 py-20 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            {t("timelineEyebrow")}
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("timelineTitle")}
          </h2>
          <div className="relative mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-blue-400/0 via-blue-300/50 to-cyan-300/0 md:block"
            />
            {milestones.map((key, index) => (
              <RevealCard key={key} delay={index * 0.12} className="relative">
                <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-cyan-200/30 bg-slate-950 text-xs font-bold text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
                  0{index + 1}
                </span>
                <h3 className="mt-6 text-lg font-semibold">
                  {t(`journey.${key}.title`)}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
                  {t(`journey.${key}.description`)}
                </p>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
