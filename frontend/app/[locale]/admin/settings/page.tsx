import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminSettingsPage({
  params,
}: SettingsPageProps) {
  const [{ locale }, session] = await Promise.all([params, auth()]);
  if (!session) {
    redirect(`/${locale}/login`);
  }
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user?.role ?? "")) {
    redirect(`/${locale}/`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Manage your profile and password.
        </p>
      </header>
      <SettingsForm initialName={session.user?.name ?? ""} />
    </div>
  );
}
