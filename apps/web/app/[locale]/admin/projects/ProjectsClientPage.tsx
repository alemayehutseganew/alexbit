"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ProjectsDataTable } from "./ProjectsDataTable";
import { isAdminProjectRecord, type AdminProjectRecord } from "./types";

type ProjectsClientPageProps = {
  locale: string;
  accessToken: string;
};

async function getResponseError(
  response: Response,
  fallback: string,
): Promise<string> {
  if (response.status >= 500) {
    return fallback;
  }

  const result: unknown = await response.json().catch(() => null);
  if (typeof result === "object" && result !== null && "message" in result) {
    const message = result.message;
    if (typeof message === "string") {
      return message;
    }
    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === "string")
    ) {
      return message.join(", ");
    }
  }

  return fallback;
}

function ProjectsLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading projects"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="space-y-4 p-5">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-4 border-t border-slate-100 py-4 sm:grid-cols-5"
          >
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading project data</span>
    </div>
  );
}

export function ProjectsClientPage({
  locale,
  accessToken,
}: ProjectsClientPageProps) {
  const [projects, setProjects] = useState<AdminProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    setIsLoading(true);
    setError(null);

    if (!apiUrl) {
      setError("The API URL is not configured.");
      setIsLoading(false);
      return () => controller.abort();
    }

    async function loadProjects() {
      try {
        const response = await fetch(`${apiUrl}/api/projects/admin/all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            await getResponseError(
              response,
              "Unable to load projects right now.",
            ),
          );
        }

        const result: unknown = await response.json();
        if (!Array.isArray(result) || !result.every(isAdminProjectRecord)) {
          throw new Error("The server returned an invalid projects response.");
        }

        setProjects(result);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load projects right now.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();
    return () => controller.abort();
  }, [accessToken, refreshKey]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-brand-600">Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Project Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and manage all active PrimeHorizon initiatives.
        </p>
      </div>

      {isLoading ? (
        <ProjectsLoadingSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load projects</p>
            <p className="mt-1">{error}</p>
          </div>
          <Button type="button" variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      ) : (
        <ProjectsDataTable projects={projects} locale={locale} />
      )}
    </div>
  );
}
