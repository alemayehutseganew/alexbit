"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export type NavbarLabels = {
  home: string;
  about: string;
  expertise: string;
  investors: string;
  contact: string;
  clientPortal: string;
  shareholderPortal: string;
  menu: string;
  close: string;
  language: string;
  english: string;
  amharic: string;
  darkMode: string;
  lightMode: string;
};

type NavbarProps = {
  locale: string;
  labels: NavbarLabels;
  themeToggleAction: ReactNode;
  clientPortalAction: ReactNode;
  shareholderPortalAction: ReactNode;
};

export function Navbar({
  locale,
  labels,
  themeToggleAction,
  clientPortalAction,
  shareholderPortalAction,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    { href: `/${locale}`, label: labels.home },
    { href: `/${locale}/about`, label: labels.about },
    { href: `/${locale}/expertise`, label: labels.expertise },
    { href: `/${locale}/investors`, label: labels.investors },
    { href: `/${locale}/contact`, label: labels.contact },
  ];
  const alternateLocalePath = (nextLocale: string) =>
    `/${nextLocale}${pathname.replace(/^\/(en|am)(?=\/|$)/, "")}`;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <motion.header
      className={`isolate sticky top-4 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-7xl border border-slate-200/80 bg-white/80 text-slate-900 shadow-[0_12px_48px_rgba(2,6,23,0.12)] backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-white/90 after:absolute after:inset-x-8 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-cyan-500/70 after:to-transparent after:shadow-[0_0_16px_rgba(103,232,249,0.45)] dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_12px_48px_rgba(2,6,23,0.3)] dark:before:bg-slate-950/75 ${
        menuOpen ? "rounded-2xl before:rounded-2xl" : "rounded-full before:rounded-full"
      }`}
      initial={{ y: -16 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex min-h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-3"
          aria-label="PrimeHorizon home"
          onClick={() => setMenuOpen(false)}
        >
          <BrandLogo
            alt=""
            priority
            className="size-11 rounded-xl bg-white object-contain p-0.5 shadow-sm"
          />
          <span className="hidden text-sm font-bold leading-tight tracking-tight sm:block">
            PrimeHorizon
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-blue-100/60">
              Group Trading PLC
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                pathname === link.href
                  ? "bg-blue-50 text-brand-700 dark:bg-white/10 dark:text-cyan-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-brand-700 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            role="group"
            aria-label={labels.language}
            className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-semibold dark:border-white/10 dark:bg-white/[0.04]"
          >
            <Link
              href={alternateLocalePath("en")}
              aria-current={locale === "en" ? "page" : undefined}
              className={`rounded-full px-2 py-1.5 transition hover:text-brand-600 dark:hover:text-white ${
                locale === "en"
                  ? "bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-cyan-100"
                  : "text-slate-500 dark:text-white/60"
              }`}
            >
              {labels.english}
            </Link>
            <span aria-hidden="true" className="text-white/30">
              |
            </span>
            <Link
              href={alternateLocalePath("am")}
              aria-current={locale === "am" ? "page" : undefined}
              className={`rounded-full px-2 py-1.5 transition hover:text-brand-600 dark:hover:text-white ${
                locale === "am"
                  ? "bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-cyan-100"
                  : "text-slate-500 dark:text-white/60"
              }`}
            >
              {labels.amharic}
            </Link>
          </div>
          {themeToggleAction}
          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            {clientPortalAction}
            {shareholderPortalAction}
          </div>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 xl:hidden dark:border-white/15 dark:text-white"
            aria-label={menuOpen ? labels.close : labels.menu}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            id="public-mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-slate-200 bg-white/95 px-5 py-5 backdrop-blur-xl xl:hidden dark:border-white/10 dark:bg-slate-900/90"
          >
            <nav
              className="mx-auto flex max-w-7xl flex-col gap-1"
              aria-label="Mobile"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                    pathname === link.href
                      ? "bg-blue-50 text-brand-700 dark:bg-white/10 dark:text-cyan-100"
                      : "text-slate-700 hover:bg-slate-100 hover:text-brand-700 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2 dark:border-white/10">
                {clientPortalAction}
                {shareholderPortalAction}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
