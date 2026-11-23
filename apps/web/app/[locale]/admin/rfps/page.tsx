import { auth } from "@/auth";
import { RfpClientPage } from "./RfpClientPage";
import { redirect } from "next/navigation";

type AdminRfpsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminRfpsPage({ params }: AdminRfpsPageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.accessToken) {
    redirect(`/${locale}/login?realm=client`);
  }

  return <RfpClientPage locale={locale} accessToken={session.accessToken} />;
}
