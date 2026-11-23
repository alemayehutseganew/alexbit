"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

type ClientDashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ClientDashboardError({
  error,
  reset,
}: ClientDashboardErrorProps) {
  const t = useTranslations("ClientPortal");

  useEffect(() => {
    console.error("Client dashboard failed to load", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"
    >
      <p className="font-semibold">{t("projectsLoadError")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-800 shadow-sm"
      >
        {t("retry")}
      </button>
    </div>
  );
}
