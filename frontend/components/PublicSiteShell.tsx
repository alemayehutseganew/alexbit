"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/brand/Footer";
import { Navbar, type NavbarLabels } from "@/components/brand/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

type PublicSiteShellProps = {
  children: React.ReactNode;
  locale: string;
  nav: NavbarLabels;
  footer: {
    nameEn: string;
    nameAm: string;
    phone: string;
    tagline: string;
    quickLinksTitle: string;
    contactTitle: string;
    portalsTitle: string;
    emailLabel: string;
    phoneLabel: string;
    requestProposal: string;
    allRightsReserved: string;
    email: string;
    year: number;
  };
};

export function PublicSiteShell({
  children,
  locale,
  nav,
  footer,
}: PublicSiteShellProps) {
  const pathname = usePathname();
  const firstRouteSegment = pathname.split("/")[2];
  const isPortalRoute = ["admin", "client", "shareholder"].includes(
    firstRouteSegment ?? "",
  );

  if (isPortalRoute) {
    return <>{children}</>;
  }

  return (
    <div className="public-site flex min-h-screen flex-col">
      <Navbar
        locale={locale}
        labels={nav}
        themeToggleAction={
          <ThemeToggle darkMode={nav.darkMode} lightMode={nav.lightMode} />
        }
        clientPortalAction={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/${locale}/client`} />}
            className="h-10 rounded-lg border-slate-300 px-4 text-slate-700 hover:border-brand-600 hover:bg-blue-50 hover:text-brand-700 dark:border-white/20 dark:text-white dark:hover:border-cyan-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {nav.clientPortal}
          </Button>
        }
        shareholderPortalAction={
          <Button
            nativeButton={false}
            render={<Link href={`/${locale}/login?role=shareholder`} />}
            className="h-10 rounded-lg bg-brand-600 px-4 text-white shadow-sm hover:bg-brand-700"
          >
            {nav.shareholderPortal}
          </Button>
        }
      />
      <main className="flex-1">{children}</main>
      <Footer
        locale={locale}
        {...footer}
        home={nav.home}
        about={nav.about}
        expertise={nav.expertise}
        investors={nav.investors}
        contact={nav.contact}
        clientPortal={nav.clientPortal}
        shareholderPortal={nav.shareholderPortal}
      />
    </div>
  );
}
