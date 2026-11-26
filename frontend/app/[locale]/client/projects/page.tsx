import { auth } from "@/auth";
import { ProjectCard, type ProjectCardData } from "@/components/brand/ProjectCard";
import { FolderKanban } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

type ClientProjectsPageProps = {
  params: Promise<{ locale: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProject(value: unknown): value is ProjectCardData {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "string" &&
    (typeof value.startDate === "string" || value.startDate === null) &&
    (typeof value.endDate === "string" || value.endDate === null)
  );
}

function SkeletonProjectCard() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <span className="h-8 w-24 rounded-full bg-slate-200" />
      </div>
      <div className="mt-6">
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full w-3/4 bg-slate-300" />
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Start Date</dt>
          <dd className="mt-1 h-4 w-32 bg-slate-200 rounded" />
        </div>
        <div>
          <dt className="text-slate-500">End Date</dt>
          <dd className="mt-1 h-4 w-32 bg-slate-200 rounded" />
        </div>
      </dl>
    </article>
  );
}

export default async function ClientProjectsPage({
  params,
}: ClientProjectsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    auth(),
    getTranslations({ locale, namespace: "ClientPortal" }),
  ]);
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

  const response = await fetch(new URL("/api/projects", apiUrl), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to load client projects");
  }

  const responseData: unknown = await response.json();
  if (!Array.isArray(responseData) || !responseData.every(isProject)) {
    throw new Error("Projects API returned an invalid response");
  }

  const name = session.user?.name?.trim() || t("clientFallback");

  return (
    <div>
      <section className="mb-8">
        <p className="text-sm font-semibold text-brand-600">{t("workspace")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {t("myProjects")}
        </h1>
        <p className="mt-2 text-slate-600">{t("projectsDescription")}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
              <FolderKanban aria-hidden="true" size={20} />
            </span>
            <h2 className="font-semibold text-slate-900">
              {t("activeProjects")}
            </h2>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
            {responseData.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {responseData.length
            ? responseData.map((project, index) => {
                const status = project.status.toUpperCase();
                const statusLabel =
                  status === "PLANNING"
                    ? t("statusPlanning")
                    : status === "IN_PROGRESS"
                      ? t("statusInProgress")
                      : status === "COMPLETED"
                        ? t("statusCompleted")
                        : project.status.replaceAll("_", " ");

                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    locale={locale}
                    statusLabel={statusLabel}
                    startDateLabel={t("startDate")}
                    endDateLabel={t("endDate")}
                  />
                );
              })
            : Array.from({ length: 3 }).map((_, i) => (
                <SkeletonProjectCard key={i} />
              ))}
        </div>

        {!responseData.length && (
          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2 xl:col-span-3">
            {t("noProjects")}
          </p>
        )}
      </section>
    </div>
  );
}
