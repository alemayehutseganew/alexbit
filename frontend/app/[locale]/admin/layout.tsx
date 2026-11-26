import type { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;

  return <AdminShell locale={locale}>{children}</AdminShell>;
}
