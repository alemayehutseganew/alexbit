import { auth } from "@/auth";
import { ContactMessagesClient } from "./ContactMessagesClient";
import { redirect } from "next/navigation";

type ContactMessagesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactMessagesPage({
  params,
}: ContactMessagesPageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.accessToken) {
    redirect(`/${locale}/login?realm=client`);
  }
  return (
    <ContactMessagesClient locale={locale} accessToken={session.accessToken} />
  );
}
