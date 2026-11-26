import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SupportTickets } from "./SupportTickets";

type ClientSupportPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ClientSupportPage({
  params,
}: ClientSupportPageProps) {
  const { locale } = await params;

  const [session] = await Promise.all([auth()]);
  const actualRole = session?.user?.role ?? session?.role;
  if (
    ![
      "CLIENT",
      "CLIENT_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
      "PROJECT_MANAGER",
    ].includes(actualRole ?? "") ||
    !session?.tenantId
  ) {
    redirect(`/${locale}/login?realm=client`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const accessToken = session.accessToken;
  if (!accessToken) {
    throw new Error("An API access token is not available in this session");
  }

  return <SupportTickets apiUrl={apiUrl} accessToken={accessToken} />;
}
