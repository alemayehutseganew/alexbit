"use client";

import { Button } from "@/components/ui/button";
import {
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "RFPs", href: "/admin/rfps", icon: FileText },
  { label: "Projects", href: "/admin/projects", icon: BriefcaseBusiness },
  { label: "Contact Messages", href: "/admin/contact", icon: Mail },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

type AdminShellProps = {
  children: ReactNode;
  locale: string;
};

export function AdminShell({ children, locale }: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const sidebarWidth = isCollapsed ? 76 : 256;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 cursor-default bg-slate-950/30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className={`fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden border-r border-slate-200 bg-white transition-transform duration-200 md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href={`/${locale}/admin`}
          className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5"
          aria-label="PrimeHorizon Admin dashboard"
        >
          <BrandLogo
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
          />
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="whitespace-nowrap text-sm font-bold text-slate-900"
              >
                PrimeHorizon
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Admin">
          {navigation.map(({ label, href, icon: Icon }) => {
            const localizedHref = `/${locale}${href}`;
            const isActive =
              href === "/admin"
                ? pathname === localizedHref
                : pathname === localizedHref ||
                  pathname.startsWith(`${localizedHref}/`);

            return (
              <Link
                key={href}
                href={localizedHref}
                title={isCollapsed ? label : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsMobileOpen(false)}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          {!isCollapsed && (
            <p className="truncate px-2 py-2 text-xs text-slate-500">
              Internal workspace
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            className="w-full justify-center text-slate-500 hover:text-slate-900"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          >
            {isCollapsed ? (
              <ChevronRight aria-hidden="true" />
            ) : (
              <ChevronLeft aria-hidden="true" />
            )}
          </Button>
        </div>
      </motion.aside>

      <div
        className={`min-h-screen transition-[margin] duration-200 ${
          isCollapsed ? "md:ml-[76px]" : "md:ml-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isMobileOpen}
              className="size-11 md:hidden"
              onClick={() => setIsMobileOpen((open) => !open)}
            >
              <Menu aria-hidden="true" />
            </Button>
            <BrandLogo
              alt=""
              className="size-8 rounded-md bg-white p-0.5 object-contain md:hidden"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Internal Admin
              </p>
              <p className="text-xs text-slate-500">PrimeHorizon Group</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative text-slate-600"
            >
              <Bell aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-brand-700">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-5 text-slate-800">
                  Admin User
                </p>
                <p className="text-xs leading-4 text-slate-500">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
