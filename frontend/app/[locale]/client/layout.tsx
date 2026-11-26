import { ClientShell } from "./ClientShell";

type ClientLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ClientLayout({
  children,
  params,
}: ClientLayoutProps) {
  const { locale } = await params;

  return <ClientShell locale={locale}>{children}</ClientShell>;
}
