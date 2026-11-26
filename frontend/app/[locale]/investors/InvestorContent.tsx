"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  type Variants,
} from "framer-motion";

type InvestorContentProps = {
  locale: string;
};

const valueCards = [
  {
    title: "reasons.market",
    description: "reasons.marketDesc",
    Icon: TrendingUp,
  },
  {
    title: "reasons.esx",
    description: "reasons.esxDesc",
    Icon: ShieldCheck,
  },
  {
    title: "reasons.team",
    description: "reasons.teamDesc",
    Icon: Users,
  },
] as const;

const cardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function AnimatedCounter({
  endValue,
  suffix = "",
}: {
  endValue: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  useMotionValueEvent(count, "change", (current) => {
    setDisplayValue(Math.round(current));
  });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const controls = animate(count, endValue, {
      duration: 1.6,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [count, endValue, isInView]);

  return (
    <motion.span ref={ref}>
      {displayValue}
      {suffix}
    </motion.span>
  );
}

export function InvestorContent({ locale }: InvestorContentProps) {
  const t = useTranslations("Investors");
  const metrics = [
    { value: 20, suffix: "+", label: t("metrics.experts") },
    { value: 6, suffix: "", label: t("metrics.sectors") },
    { value: 4, suffix: "", label: t("metrics.institutions") },
  ];

  return (
    <div className="bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="relative isolate overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-slate-50 dark:from-brand-600/70 dark:via-slate-900 dark:to-black" />
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.14, 1], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 top-10 -z-10 h-96 w-96 rounded-full bg-cyan-400/25 blur-[100px]"
        />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              {t("heroSubtitle")}
            </p>
            <Link
              href={`/${locale}/login?role=shareholder`}
              className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:bg-white dark:text-brand-600 dark:hover:bg-blue-50"
            >
              {t("ctaButton")}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 transition-colors sm:py-20 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-lg shadow-blue-950/5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:shadow-blue-950/30"
            >
              <p className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                <AnimatedCounter
                  endValue={metric.value}
                  suffix={metric.suffix}
                />
              </p>
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-blue-100">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 transition-colors sm:py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t("whyInvestTitle")}
          </h2>
          <motion.div
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-10 grid gap-5 md:grid-cols-3"
          >
            {valueCards.map(({ title, description, Icon }) => (
              <motion.article
                key={title}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-black/5 backdrop-blur-md transition-colors hover:border-brand-600 hover:shadow-blue-900/10 dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/20 dark:hover:shadow-blue-900/30"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-600/15 dark:text-blue-300">
                  <Icon
                    aria-hidden="true"
                    size={22}
                    className="drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                  />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  {t(title)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(description)}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 pb-24 pt-8 transition-colors dark:bg-slate-950">
        <div className="mx-auto max-w-6xl rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8 shadow-2xl shadow-blue-950/10 sm:p-12 dark:border-blue-300/20 dark:from-brand-600/25 dark:via-slate-900 dark:to-slate-950 dark:shadow-blue-950/40">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {t("ctaButton")}
            </h2>
            <Link
              href={`/${locale}/login?role=shareholder`}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t("ctaButton")}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
