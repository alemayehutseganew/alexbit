import { auth } from "@/auth";
import { ProjectsClientPage } from "./ProjectsClientPage";
import { redirect } from "next/navigation";

type AdminProjectsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminProjectsPage({
  params,
}: AdminProjectsPageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.accessToken) {
    redirect(`/${locale}/login?realm=client`);
  }

  return (
    <ProjectsClientPage locale={locale} accessToken={session.accessToken} />
  );
}
