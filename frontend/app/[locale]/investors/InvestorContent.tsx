"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AnimatedCounter } from "@/components/AnimatedCounter";

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

export function InvestorContent({ locale }: InvestorContentProps) {
  const t = useTranslations("Investors");
  const metrics = [
    { value: 20, suffix: "+", label: t("metrics.experts") },
    { value: 6, suffix: "", label: t("metrics.sectors") },
    { value: 4, suffix: "", label: t("metrics.institutions") },
  ];

  return (
    <div className="bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="relative isolate overflow-hidden bg-[#061426] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_20%,rgba(11,74,139,0.55),transparent_44%),radial-gradient(ellipse_at_12%_100%,rgba(22,101,52,0.18),transparent_40%)]" />
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.14, 1], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 top-10 -z-10 h-96 w-96 rounded-full bg-cyan-400/15 blur-[100px]"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
              <span className="size-1.5 rounded-full bg-[#f2b632]" aria-hidden="true" />
              PrimeHorizon Group Trading PLC
            </p>
            <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/75">
              {t("heroSubtitle")}
            </p>
            <Link
              href={`/${locale}/login?role=shareholder`}
              className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
            >
              {t("ctaButton")}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
          <div className="relative mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center">
            <div className="absolute inset-[8%] rounded-full border border-white/10" />
            <div className="absolute inset-[20%] animate-[spin_72s_linear_infinite] rounded-full border border-dashed border-cyan-200/20" />
            <div className="absolute inset-[32%] rounded-full border border-white/10" />
            <div className="absolute size-56 rounded-full bg-brand-600/20 blur-[80px]" />
            <BrandLogo
              alt=""
              priority
              className="relative size-48 rounded-3xl bg-white object-contain p-1 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:size-56"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-blue-950/10 bg-[#071b32] py-12 text-white sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-3 sm:px-8">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="border-white/10 px-6 py-3 text-center sm:border-r sm:last:border-r-0"
            >
              <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <AnimatedCounter
                  value={metric.value}
                  suffix={metric.suffix}
                />
              </p>
              <p className="mt-3 text-sm font-medium text-blue-100/65">
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
                className="group rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_16px_50px_rgba(7,27,50,0.06)] backdrop-blur-md transition-colors hover:border-blue-300 hover:shadow-[0_26px_65px_rgba(7,27,50,0.12)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/20 dark:hover:shadow-blue-900/30"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-600/15 dark:text-blue-300">
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
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#061426] p-8 text-white shadow-[0_30px_90px_rgba(7,27,50,0.2)] sm:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t("ctaButton")}
            </h2>
            <Link
              href={`/${locale}/login?role=shareholder`}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
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
