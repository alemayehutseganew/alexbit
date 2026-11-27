"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  ChartNoAxesCombined,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Menu,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type ShareholderShellProps = {
  children: React.ReactNode;
  locale: string;
};

export function ShareholderShell({ children, locale }: ShareholderShellProps) {
  const t = useTranslations("ShareholderPortal");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#overview");
  const items = [
    { href: "#overview", label: t("overview"), Icon: LayoutDashboard },
    { href: "#my-holdings", label: t("holdings"), Icon: ChartNoAxesCombined },
    { href: "#cap-table", label: t("capTable"), Icon: Landmark },
    { href: "#governance", label: t("governance"), Icon: ScrollText },
    { href: "#kyc-documents", label: t("kycDocuments"), Icon: FileCheck2 },
  ];

  useEffect(() => {
    const syncActiveSection = () => {
      setActiveHref(window.location.hash || "#overview");
    };

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);

    const sections = [
      "#overview",
      "#my-holdings",
      "#cap-table",
      "#governance",
      "#kyc-documents",
    ]
      .map((href) => document.querySelector(href))
      .filter((section): section is Element => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveHref(`#${visible.target.id}`);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", syncActiveSection);
      observer.disconnect();
    };
  }, []);

  function navigateToSection(href: string) {
    setActiveHref(href);
    setMobileNavOpen(false);
  }

  return (
    <div className="portal-theme min-h-screen w-full bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-slate-200 bg-white backdrop-blur-xl md:flex">
        <div className="border-b border-slate-200 px-7 py-7">
          <Link
            href={`/${locale}`}
            className="group inline-flex items-center gap-3 text-sm font-bold tracking-wide text-slate-900"
          >
            <BrandLogo
              alt=""
              className="size-10 rounded-xl bg-white object-contain p-0.5 shadow-lg shadow-brand-950/40"
            />
            <span>
              PrimeHorizon
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Group PLC
              </span>
            </span>
          </Link>
          <p className="mt-5 text-xs font-medium text-slate-400">{t("portalName")}</p>
        </div>
        <nav
          className="flex-1 space-y-1 px-4 py-6"
          aria-label={t("portalName")}
        >
          {items.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              onClick={() => navigateToSection(href)}
              aria-current={activeHref === href ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                activeHref === href
                  ? "border-r-4 border-brand-600 bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`grid size-8 place-items-center rounded-lg transition ${
                  activeHref === href
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                }`}
              >
                <Icon aria-hidden="true" size={17} />
              </span>
              {label}
              {activeHref === href && (
                <motion.span
                  layoutId="shareholder-active-dot"
                  className="ml-auto size-1.5 rounded-full bg-brand-600 shadow-[0_0_12px_#93c5fd]"
                />
              )}
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-7 py-5">
          <button
            type="button"
            onClick={() => void signOut({ redirectTo: `/${locale}/login` })}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-brand-700"
          >
            <LogOut aria-hidden="true" size={16} />
            {t("signOut")}
          </button>
        </div>
      </aside>
      <div className="min-h-screen w-full md:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <BrandLogo
                alt=""
                className="size-8 rounded-md bg-white p-0.5 object-contain md:hidden"
              />
              <span className="text-sm font-semibold text-slate-800">
                {t("portalName")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={
                  mobileNavOpen ? "Close navigation" : "Open navigation"
                }
                aria-expanded={mobileNavOpen}
                aria-controls="shareholder-mobile-navigation"
                className="inline-flex size-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:hidden"
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                {mobileNavOpen ? (
                  <X aria-hidden="true" size={20} />
                ) : (
                  <Menu aria-hidden="true" size={20} />
                )}
              </button>
              <button
                type="button"
                onClick={() => void signOut({ redirectTo: `/${locale}/login` })}
                className="hidden min-h-11 items-center gap-2 rounded-md px-2 text-xs font-semibold text-slate-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:inline-flex"
              >
                <LogOut aria-hidden="true" size={15} />
                {t("signOut")}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {mobileNavOpen && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close navigation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-30 bg-slate-900/20 md:hidden"
                  onClick={() => setMobileNavOpen(false)}
                />
                <motion.nav
                  id="shareholder-mobile-navigation"
                  aria-label={t("portalName")}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-x-3 top-[calc(100%-0.25rem)] z-40 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:hidden"
                >
                  {items.map(({ href, label, Icon }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => navigateToSection(href)}
                      aria-current={activeHref === href ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                        activeHref === href
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon aria-hidden="true" size={18} />
                      {label}
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      void signOut({ redirectTo: `/${locale}/login` })
                    }
                    className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-lg border-t border-slate-200 px-3 pt-2 text-sm font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    <LogOut aria-hidden="true" size={18} />
                    {t("signOut")}
                  </button>
                </motion.nav>
              </>
            )}
          </AnimatePresence>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
