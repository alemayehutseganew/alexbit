"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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
        <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl border border-cyan-100/20 bg-white/10 text-cyan-200 shadow-[0_0_32px_rgba(34,211,238,0.16)] backdrop-blur-sm">
          <ShieldCheck aria-hidden="true" size={22} strokeWidth={1.8} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200 sm:text-sm">
          {eyebrow}
        </p>
        <div className="mt-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-cyan-300 to-transparent" />
      </div>

      <div className="my-auto max-w-xl py-12">
        <h1 className="max-w-[13ch] text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-7 max-w-lg text-base leading-7 text-slate-100/90 sm:text-lg sm:leading-8">
          {description}
        </p>
      </div>

      <footer className="border-t border-white/15 pt-5">
        <p className="text-sm font-semibold tracking-[0.12em] text-white">
          {phone}
        </p>
        <p className="mt-3 text-xs font-medium leading-5 text-slate-200 sm:text-sm">
          {companyNameEn}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
          {companyNameAm}
        </p>
      </footer>
    </motion.div>
  );
}
