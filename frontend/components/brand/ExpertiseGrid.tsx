"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Code2,
  GraduationCap,
  Headset,
  RadioTower,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ExpertiseGridIcon =
  "education" | "itSupport" | "software" | "telecom" | "solar" | "power";

export type ExpertiseGridItem = {
  icon: ExpertiseGridIcon;
  title: string;
  description: string;
};

type ExpertiseGridProps = {
  eyebrow: string;
  title: string;
  linkHref: string;
  linkLabel: string;
  items: ExpertiseGridItem[];
};

const layouts = [
  "md:col-span-2",
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-3",
];

const icons: Record<ExpertiseGridIcon, LucideIcon> = {
  education: GraduationCap,
  itSupport: Headset,
  software: Code2,
  telecom: RadioTower,
  solar: Sun,
  power: Zap,
};

export function ExpertiseGrid({
  eyebrow,
  title,
  linkHref,
  linkLabel,
  items,
}: ExpertiseGridProps) {
  return (
    <section className="border-y border-slate-200 bg-white px-6 py-24 text-slate-900 transition-colors sm:px-8 sm:py-28 dark:border-white/10 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-cyan-300">
              {eyebrow}
            </p>
            <h2 className="mt-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl dark:from-white dark:to-slate-400">
              {title}
            </h2>
          </div>
          <a
            href={linkHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-600 dark:text-cyan-200 dark:hover:text-white"
          >
            {linkLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="relative mt-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-12 inset-y-8 -z-10 bg-brand-100/60 opacity-30 blur-3xl"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {items.map(({ icon, title: itemTitle, description }, index) => {
              const Icon = icons[icon];

              return (
                <div
                  key={itemTitle}
                  className={`rounded-2xl ${layouts[index] ?? ""}`}
                >
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="premium-card group relative h-full min-h-52 overflow-hidden p-6 sm:p-7"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -right-14 -top-14 size-40 rounded-full bg-brand-600/10 blur-3xl transition group-hover:bg-cyan-400/20 dark:bg-brand-600/15"
                    />
                    <div className="relative flex size-11 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50 text-brand-600 dark:border-blue-200/15 dark:bg-blue-400/10 dark:text-cyan-200">
                      <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
                    </div>
                    <h3 className="relative mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                      {itemTitle}
                    </h3>
                    <p className="relative mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {description}
                    </p>
                  </motion.article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
