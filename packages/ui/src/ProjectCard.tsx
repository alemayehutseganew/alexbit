"use client";

import { motion } from "framer-motion";

export type ProjectCardData = {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

type ProjectCardProps = {
  project: ProjectCardData;
  locale: string;
  statusLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  index?: number;
};

function getProgress(status: string): number {
  switch (status.toUpperCase()) {
    case "PLANNING":
      return 10;
    case "IN_PROGRESS":
      return 50;
    case "COMPLETED":
      return 100;
    default:
      return 0;
  }
}

function formatDate(value: string | null, locale: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date);
}

export function ProjectCard({
  project,
  locale,
  statusLabel,
  startDateLabel,
  endDateLabel,
  index = 0,
}: ProjectCardProps) {
  const progress = getProgress(project.status);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        opacity: { duration: 0.4, delay: index * 0.08 },
        y: { duration: 0.4, delay: index * 0.08 },
        scale: { duration: 0.18 },
      }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {project.title}
        </h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-600">
          {statusLabel}
        </span>
      </div>
      <div className="mt-6">
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-brand-600"
          />
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">{startDateLabel}</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {formatDate(project.startDate, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{endDateLabel}</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {formatDate(project.endDate, locale)}
          </dd>
        </div>
      </dl>
    </motion.article>
  );
}
