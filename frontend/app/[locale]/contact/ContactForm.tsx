"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ContactSchema,
  type ContactInput,
} from "@/lib/schemas/contact.schema";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fieldClassName =
  "mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-brand-600 focus:shadow-[0_0_24px_rgba(11,74,139,0.14)]";

export function ContactForm() {
  const t = useTranslations("Contact");
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      subject: "GENERAL",
      message: "",
    },
  });

  async function onSubmit(data: ContactInput) {
    setSubmitted(false);
    setSubmissionError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setSubmissionError(t("apiUnavailable"));
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : t("sendError");
        throw new Error(message);
      }

      setSubmitted(true);
      reset();
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : t("sendError"),
      );
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      {submitted && (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {t("success")}
        </p>
      )}
      {submissionError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {submissionError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t("fullName")}
          <Input
            className={fieldClassName}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
          {errors.fullName && (
            <span className="mt-1 block text-xs text-red-600">
              {t("invalidName")}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {t("email")}
          <Input
            className={fieldClassName}
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <span className="mt-1 block text-xs text-red-600">
              {t("invalidEmail")}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {t("phone")}
          <Input
            className={fieldClassName}
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone && (
            <span className="mt-1 block text-xs text-red-600">
              {t("invalidPhone")}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {t("subject")}
          <select
            className={fieldClassName}
            aria-invalid={Boolean(errors.subject)}
            {...register("subject")}
          >
            <option value="GENERAL">{t("subjects.general")}</option>
            <option value="PARTNERSHIP">{t("subjects.partnership")}</option>
            <option value="SUPPORT">{t("subjects.support")}</option>
            <option value="MEDIA">{t("subjects.media")}</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        {t("message")}
        <textarea
          className={`${fieldClassName} min-h-36 resize-y`}
          aria-invalid={Boolean(errors.message)}
          {...register("message")}
        />
        {errors.message && (
          <span className="mt-1 block text-xs text-red-600">
            {t("invalidMessage")}
          </span>
        )}
      </label>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 bg-brand-600 px-6 text-white hover:bg-brand-700"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
