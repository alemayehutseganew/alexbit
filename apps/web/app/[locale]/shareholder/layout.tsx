import { ShareholderShell } from "./ShareholderShell";

type ShareholderLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ShareholderLayout({
  children,
  params,
}: ShareholderLayoutProps) {
  const { locale } = await params;

  return (
    <ShareholderShell locale={locale}>{children}</ShareholderShell>
  );
}
