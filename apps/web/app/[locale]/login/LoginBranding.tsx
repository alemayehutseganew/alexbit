"use client";

import { motion } from "framer-motion";

type LoginBrandingProps = {
  eyebrow: string;
  title: string;
  description: string;
  companyNameEn: string;
  companyNameAm: string;
  phone: string;
};

export function LoginBranding({
  eyebrow,
  title,
  description,
  companyNameEn,
  companyNameAm,
  phone,
}: LoginBrandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative z-10 flex flex-1 flex-col justify-between"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">
          {eyebrow}
        </p>
        <div className="mt-4 h-px w-16 bg-cyan-300/80" />
      </div>

      <div className="my-auto max-w-xl py-16">
        <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-7 max-w-lg text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">
          {description}
        </p>
      </div>

      <footer className="border-t border-white/15 pt-5">
        <p className="text-sm font-semibold tracking-[0.12em] text-white">
          {phone}
        </p>
        <p className="mt-3 text-xs font-medium leading-5 text-blue-100 sm:text-sm">
          {companyNameEn}
        </p>
        <p className="mt-1 text-xs leading-5 text-blue-100/85 sm:text-sm">
          {companyNameAm}
        </p>
      </footer>
    </motion.div>
  );
}
