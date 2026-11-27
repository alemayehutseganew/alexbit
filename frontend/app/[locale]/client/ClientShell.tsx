"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  CircleHelp,
  FileText,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type ClientShellProps = {
  children: React.ReactNode;
  locale: string;
};

export function ClientShell({ children, locale }: ClientShellProps) {
  const t = useTranslations("ClientPortal");
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const items: { href: string; label: string; Icon: LucideIcon }[] = [
    {
      href: `/${locale}/client`,
      label: t("dashboard"),
      Icon: LayoutDashboard,
    },
    {
      href: `/${locale}/client/projects`,
      label: t("myProjects"),
      Icon: FolderKanban,
    },
    {
      href: `/${locale}/client/documents`,
      label: t("documents"),
      Icon: FileText,
    },
    {
      href: `/${locale}/client/invoices`,
      label: t("invoices"),
      Icon: FileText,
    },
    {
      href: `/${locale}/client/support`,
      label: t("support"),
      Icon: CircleHelp,
    },
  ];

  function isActive(href: string) {
    return href === `/${locale}/client`
      ? pathname === href
      : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-blue-100 bg-white md:flex">
        <div className="border-b border-slate-100 px-6 py-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-3 text-sm font-bold leading-6 text-brand-600"
          >
            <BrandLogo
              alt=""
              className="size-10 rounded-lg bg-white object-contain p-0.5"
            />
            <span>PrimeHorizon</span>
          </Link>
          <p className="mt-1 text-xs text-slate-500">{t("portalName")}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label={t("workspace")}>
          {items.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(href)
                  ? "bg-blue-50 text-brand-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => void signOut({ redirectTo: `/${locale}/login` })}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-brand-600"
          >
            <LogOut aria-hidden="true" size={16} />
            {t("signOut")}
          </button>
        </div>
      </aside>

      <div className="min-h-screen w-full md:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo
                alt=""
                className="size-8 rounded-md bg-white p-0.5 object-contain md:hidden"
              />
              <div className="text-sm font-semibold text-slate-700">
                {t("portalName")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-600 md:inline-flex">
                {t("workspace")}
              </span>
              <button
                type="button"
                aria-label={
                  mobileNavOpen ? "Close navigation" : "Open navigation"
                }
                aria-expanded={mobileNavOpen}
                aria-controls="client-mobile-navigation"
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
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-xs font-semibold text-slate-600 transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:hidden"
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
                  className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
                  onClick={() => setMobileNavOpen(false)}
                />
                <motion.nav
                  id="client-mobile-navigation"
                  aria-label={t("workspace")}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-x-3 top-[calc(100%-0.25rem)] z-40 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:hidden"
                >
                  {items.map(({ href, label, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      aria-current={isActive(href) ? "page" : undefined}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                        isActive(href)
                          ? "bg-blue-50 text-brand-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon aria-hidden="true" size={18} />
                      {label}
                    </Link>
                  ))}
                </motion.nav>
              </>
            )}
          </AnimatePresence>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
