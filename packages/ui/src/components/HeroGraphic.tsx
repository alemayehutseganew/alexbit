"use client";

import { motion } from "framer-motion";

const positions = [
  { left: "50%", top: "7%" },
  { left: "84%", top: "29%" },
  { left: "84%", top: "71%" },
  { left: "50%", top: "93%" },
  { left: "16%", top: "71%" },
  { left: "16%", top: "29%" },
];

type HeroGraphicProps = {
  labels: string[];
  orbitLabel: string;
};

export function HeroGraphic({ labels, orbitLabel }: HeroGraphicProps) {
  return (
    <div
      role="img"
      aria-label={`${orbitLabel}: ${labels.join(", ")}`}
      className="relative mx-auto flex aspect-square w-full max-w-[500px] items-center justify-center"
    >
      <div className="absolute inset-[8%] rounded-full border border-blue-900/10 dark:border-blue-200/10" />
      <motion.div
        aria-hidden="true"
        className="absolute inset-[19%] rounded-full border border-dashed border-cyan-700/20 dark:border-cyan-200/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[31%] rounded-full border border-blue-900/10 dark:border-blue-200/10" />
      <div className="absolute size-64 rounded-full bg-cyan-400/10 blur-[80px]" />

      <div className="relative z-10 flex size-44 flex-col items-center justify-center rounded-full border border-blue-200 bg-white/90 shadow-[0_0_100px_rgba(37,99,235,0.16)] backdrop-blur-xl sm:size-52 dark:border-blue-100/20 dark:bg-slate-900/80 dark:shadow-[0_0_100px_rgba(37,99,235,0.28)]">
        <span className="text-6xl font-bold tracking-tight text-brand-700 sm:text-7xl dark:text-white">
          PH
        </span>
        <span className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.24em] text-brand-600 sm:text-[10px] dark:text-blue-200">
          {orbitLabel}
        </span>
      </div>

      {labels.slice(0, positions.length).map((label, index) => (
        <div
          key={label}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={positions[index]}
        >
          <motion.span
            className="flex min-h-11 w-32 items-center justify-center rounded-xl border border-blue-200 bg-white/95 px-3 py-2 text-center text-[10px] font-semibold leading-4 text-slate-800 shadow-[0_8px_30px_rgba(2,6,23,0.12)] backdrop-blur-md sm:w-40 sm:text-xs dark:border-blue-100/15 dark:bg-slate-900/90 dark:text-blue-50 dark:shadow-[0_8px_30px_rgba(2,6,23,0.45)]"
            animate={{ y: [0, index % 2 === 0 ? -6 : 6, 0] }}
            transition={{
              duration: 3.8 + (index % 3) * 0.6,
              delay: index * 0.25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="mr-2 size-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.95)]" />
            {label}
          </motion.span>
        </div>
      ))}
    </div>
  );
}
