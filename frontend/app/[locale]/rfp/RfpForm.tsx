"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  RfpSchema,
  SectorEnum,
  type RfpInput,
} from "@/lib/schemas/rfp.schema";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

const sectors = SectorEnum.options;

export function RfpForm() {
  const t = useTranslations("Rfp");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RfpInput>({
    resolver: zodResolver(RfpSchema),
    defaultValues: {
      phone: "0914230500",
    },
  });

  const onSubmit = async (data: RfpInput) => {
    setSuccess(null);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error(t("missingApiUrl"));
      }

      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/rfp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const apiMessage =
          typeof result?.message === "string" ? result.message : null;
        throw new Error(
          response.status >= 500
            ? t("serverError")
            : apiMessage || t("requestFailed"),
        );
      }

      if (typeof result?.id !== "string") {
        throw new Error(t("requestFailed"));
      }

      setSuccess(result.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t("requestFailed"),
      );
    }
  };

  const inputClass =
    "mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-white/15 dark:bg-slate-900 dark:text-white";

  return (
    <form
      className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t("organization")}
          <input className={inputClass} {...register("organization")} />
          {errors.organization && (
            <span className="mt-1 block text-sm text-red-700">
              {errors.organization.message}
            </span>
          )}
        </label>

        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t("contactName")}
          <input className={inputClass} {...register("contactName")} />
          {errors.contactName && (
            <span className="mt-1 block text-sm text-red-700">
              {errors.contactName.message}
            </span>
          )}
        </label>

        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t("contactEmail")}
          <input
            className={inputClass}
            type="email"
            {...register("contactEmail")}
          />
          {errors.contactEmail && (
            <span className="mt-1 block text-sm text-red-700">
              {errors.contactEmail.message}
            </span>
          )}
        </label>

        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t("phone")}
          <input className={inputClass} type="tel" {...register("phone")} />
          {errors.phone && (
            <span className="mt-1 block text-sm text-red-700">
              {errors.phone.message}
            </span>
          )}
        </label>

        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 md:col-span-2">
          {t("sector")}
          <select
            className={inputClass}
            defaultValue=""
            {...register("sector")}
          >
            <option value="" disabled>
              {t("sector")}
            </option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {t(`Sectors.${sector}`)}
              </option>
            ))}
          </select>
          {errors.sector && (
            <span className="mt-1 block text-sm text-red-700">
              {errors.sector.message}
            </span>
          )}
        </label>
      </div>

      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {t("projectDetails")}
        <textarea
          className={`${inputClass} min-h-36 resize-y`}
          {...register("projectDetails")}
        />
        {errors.projectDetails && (
          <span className="mt-1 block text-sm text-red-700">
            {errors.projectDetails.message}
          </span>
        )}
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t("budgetRange")}
          <input className={inputClass} {...register("budgetRange")} />
        </label>

        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t("timeline")}
          <input className={inputClass} {...register("timeline")} />
        </label>
      </div>

      {success && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {t("success", { id: success })}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] hover:bg-brand-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && (
          <svg
            aria-hidden="true"
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {isSubmitting ? t("loading") : t("submit")}
      </button>
    </form>
  );
}
