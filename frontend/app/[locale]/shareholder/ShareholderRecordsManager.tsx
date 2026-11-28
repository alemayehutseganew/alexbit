"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type KycStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

type ShareholderProfile = {
  id: string;
  contactNo: string | null;
  tinNumber: string | null;
  numberOfShares: number;
  shareValue: number | string;
  totalContribution: number | string;
  datePaid: string | null;
  remarks: string | null;
  shareClass: string;
  isAccredited: boolean;
  kycStatus: KycStatus;
  tenant: { id: string; name: string };
};

type ProfileForm = {
  tenantName: string;
  contactNo: string;
  tinNumber: string;
  numberOfShares: string;
  shareValue: string;
  totalContribution: string;
  datePaid: string;
  remarks: string;
  shareClass: string;
  isAccredited: boolean;
  kycStatus: KycStatus;
};

type ShareholderRecordsManagerProps = {
  initialShareholders: ShareholderProfile[];
  accessToken: string;
  role: string;
  email: string;
  locale: string;
  initialSearch: string;
};

const emptyForm: ProfileForm = {
  tenantName: "",
  contactNo: "",
  tinNumber: "",
  numberOfShares: "0",
  shareValue: "1000",
  totalContribution: "0",
  datePaid: "",
  remarks: "",
  shareClass: "ORDINARY",
  isAccredited: false,
  kycStatus: "PENDING",
};

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isShareholderProfile(value: unknown): value is ShareholderProfile {
  if (!isRecord(value) || !isRecord(value.tenant)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    (typeof value.contactNo === "string" || value.contactNo === null) &&
    (typeof value.tinNumber === "string" || value.tinNumber === null) &&
    typeof value.numberOfShares === "number" &&
    (typeof value.shareValue === "string" ||
      typeof value.shareValue === "number") &&
    (typeof value.totalContribution === "string" ||
      typeof value.totalContribution === "number") &&
    (typeof value.datePaid === "string" || value.datePaid === null) &&
    (typeof value.remarks === "string" || value.remarks === null) &&
    typeof value.shareClass === "string" &&
    typeof value.isAccredited === "boolean" &&
    ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(
      String(value.kycStatus),
    ) &&
    typeof value.tenant.id === "string" &&
    typeof value.tenant.name === "string"
  );
}

async function responseError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }
  return `Request failed (HTTP ${response.status}).`;
}

function formFromProfile(profile: ShareholderProfile): ProfileForm {
  return {
    tenantName: profile.tenant.name,
    contactNo: profile.contactNo ?? "",
    tinNumber: profile.tinNumber ?? "",
    numberOfShares: String(profile.numberOfShares),
    shareValue: String(profile.shareValue),
    totalContribution: String(profile.totalContribution),
    datePaid: profile.datePaid ? profile.datePaid.slice(0, 10) : "",
    remarks: profile.remarks ?? "",
    shareClass: profile.shareClass,
    isAccredited: profile.isAccredited,
    kycStatus: profile.kycStatus,
  };
}

export default function ShareholderRecordsManager({
  initialShareholders,
  accessToken,
  role,
  email,
  locale,
  initialSearch,
}: ShareholderRecordsManagerProps) {
  const router = useRouter();
  const t = useTranslations("ShareholderPortal");
  const [shareholders, setShareholders] = useState(initialShareholders);
  const [search, setSearch] = useState(initialSearch);
  const [editingProfile, setEditingProfile] =
    useState<ShareholderProfile | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canManage =
    email.trim().toLowerCase() !== "shareholder@primehorizon.com" &&
    [
      "SHAREHOLDER_ADMIN",
      "SHAREHOLDER_MANAGER",
      "ADMIN",
      "SUPER_ADMIN",
    ].includes(role);

  const filteredShareholders = shareholders.filter((shareholder) => {
    const term = search
      .trim()
      .toLocaleLowerCase(locale === "am" ? "am-ET" : "en-ET");
    return (
      shareholder.tenant.name
        .toLocaleLowerCase(locale === "am" ? "am-ET" : "en-ET")
        .includes(term) ||
      (shareholder.tinNumber?.toLocaleLowerCase().includes(term) ?? false)
    );
  });

  function openCreateForm() {
    setEditingProfile(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setError(null);
    setMessage(null);
  }

  function openEditForm(profile: ShareholderProfile) {
    setEditingProfile(profile);
    setForm(formFromProfile(profile));
    setIsFormOpen(true);
    setError(null);
    setMessage(null);
  }

  function closeForm() {
    setEditingProfile(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  async function reloadShareholders() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      throw new Error(t("apiNotConfigured"));
    }

    const response = await fetch(`${apiUrl}/api/shareholder/all`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(await responseError(response));
    }

    const result: unknown = await response.json();
    if (!Array.isArray(result) || !result.every(isShareholderProfile)) {
      throw new Error(t("invalidResponse"));
    }
    setShareholders(result);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setError(t("apiNotConfigured"));
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    const payload = {
      tenantName: form.tenantName.trim(),
      contactNo: form.contactNo.trim() || null,
      tinNumber: form.tinNumber.trim() || null,
      numberOfShares: Number(form.numberOfShares),
      shareValue: Number(form.shareValue),
      totalContribution: Number(form.totalContribution),
      datePaid: form.datePaid || null,
      remarks: form.remarks.trim() || null,
      shareClass: form.shareClass.trim(),
      isAccredited: form.isAccredited,
      kycStatus: form.kycStatus,
    };

    try {
      const response = await fetch(
        editingProfile
          ? `${apiUrl}/api/shareholder/${editingProfile.id}`
          : `${apiUrl}/api/shareholder`,
        {
          method: editingProfile ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error(await responseError(response));
      }

      await reloadShareholders();
      setMessage(editingProfile ? t("profileUpdated") : t("profileCreated"));
      closeForm();
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("saveProfileError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProfile(profile: ShareholderProfile) {
    if (
      !window.confirm(t("deleteProfileConfirm", { name: profile.tenant.name }))
    ) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setError(t("apiNotConfigured"));
      return;
    }

    setBusyProfileId(profile.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/shareholder/${profile.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error(await responseError(response));
      }

      setShareholders((current) =>
        current.filter((item) => item.id !== profile.id),
      );
      setMessage(t("profileDeleted"));
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("deleteProfileError"),
      );
    } finally {
      setBusyProfileId(null);
    }
  }

  return (
    <section
      id="cap-table"
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
    >
      <div className="flex flex-col justify-between gap-5 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-6 md:flex-row md:items-end md:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
            {t("capTableEyebrow")}
          </p>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
            {t("manageShareholderRecords")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {t("manageShareholderRecordsDescription")}
          </p>
          <span className="mt-4 inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {t("shareholderCount", { count: shareholders.length })}
          </span>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <label htmlFor="shareholder-search" className="sr-only">
            {t("searchShareholders")}
          </label>
          <input
            id="shareholder-search"
            type="search"
            placeholder={t("searchShareholders")}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            className={`${fieldClassName} sm:min-w-64`}
          />
          {canManage && (
            <button
              type="button"
              onClick={openCreateForm}
              className="shrink-0 rounded-xl bg-gradient-to-r from-brand-700 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/15 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
            >
              {t("addShareholder")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mx-6 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 md:mx-8"
        >
          {message}
        </p>
      )}

      <div className="overflow-x-auto px-2 pb-3 md:px-4">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <th scope="col" className="rounded-l-xl px-4 py-4 font-bold">
                {t("columnSerial")}
              </th>
              <th scope="col" className="px-4 py-4 font-bold">
                {t("columnName")}
              </th>
              <th scope="col" className="px-4 py-4 font-bold">
                {t("columnContact")}
              </th>
              <th scope="col" className="px-4 py-4 font-bold">
                {t("columnTin")}
              </th>
              <th scope="col" className="px-4 py-4 text-right font-bold">
                {t("columnShares")}
              </th>
              <th scope="col" className="px-4 py-4 text-right font-bold">
                {t("columnContribution")}
              </th>
              <th scope="col" className="px-4 py-4 font-bold">
                {t("columnDatePaid")}
              </th>
              {canManage && (
                <th scope="col" className="rounded-r-xl px-4 py-4 font-bold">
                  {t("columnActionsManage")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredShareholders.map((shareholder, index) => (
              <tr
                key={shareholder.id}
                className="group transition-colors hover:bg-blue-50/60"
              >
                <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold tabular-nums text-slate-400 group-hover:text-brand-700">
                  {index + 1}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-900">
                  {shareholder.tenant.name}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                  {shareholder.contactNo || "—"}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                  {shareholder.tinNumber || "—"}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-right font-semibold tabular-nums text-slate-900">
                  {shareholder.numberOfShares.toLocaleString(
                    locale === "am" ? "am-ET" : "en-ET",
                  )}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-right font-semibold tabular-nums text-brand-700">
                  ETB{" "}
                  {new Intl.NumberFormat(locale === "am" ? "am-ET" : "en-ET", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(shareholder.totalContribution))}
                </td>
                <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                  {shareholder.datePaid
                    ? new Intl.DateTimeFormat(
                        locale === "am" ? "am-ET" : "en-ET",
                        { dateStyle: "medium", timeZone: "UTC" },
                      ).format(new Date(shareholder.datePaid))
                    : "—"}
                </td>
                {canManage && (
                  <td className="border-b border-slate-100 px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(shareholder)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        disabled={busyProfileId !== null}
                        onClick={() => void deleteProfile(shareholder)}
                        className="rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {busyProfileId === shareholder.id
                          ? "Deleting…"
                          : t("delete")}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredShareholders.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 8 : 7}
                  className="p-12 text-center text-sm text-slate-500"
                >
                  {t("noShareholders")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canManage && isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shareholder-form-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4"
        >
          <form
            onSubmit={saveProfile}
            className="mx-auto my-8 max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-xl"
          >
            <h3
              id="shareholder-form-title"
              className="text-lg font-semibold text-slate-900"
            >
              {editingProfile ? t("editProfile") : t("createProfile")}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                {t("shareholderName")}
                <input
                  required
                  maxLength={120}
                  className={fieldClassName}
                  value={form.tenantName}
                  onChange={(event) =>
                    setForm({ ...form, tenantName: event.currentTarget.value })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("contactNumber")}
                <input
                  className={fieldClassName}
                  value={form.contactNo}
                  onChange={(event) =>
                    setForm({ ...form, contactNo: event.currentTarget.value })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("columnTin")}
                <input
                  className={fieldClassName}
                  value={form.tinNumber}
                  onChange={(event) =>
                    setForm({ ...form, tinNumber: event.currentTarget.value })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("numberOfShares")}
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  className={fieldClassName}
                  value={form.numberOfShares}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      numberOfShares: event.currentTarget.value,
                    })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("shareValue")}
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className={fieldClassName}
                  value={form.shareValue}
                  onChange={(event) =>
                    setForm({ ...form, shareValue: event.currentTarget.value })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("columnContribution")}
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className={fieldClassName}
                  value={form.totalContribution}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      totalContribution: event.currentTarget.value,
                    })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("columnDatePaid")}
                <input
                  type="date"
                  className={fieldClassName}
                  value={form.datePaid}
                  onChange={(event) =>
                    setForm({ ...form, datePaid: event.currentTarget.value })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("shareClass")}
                <input
                  required
                  maxLength={40}
                  className={fieldClassName}
                  value={form.shareClass}
                  onChange={(event) =>
                    setForm({ ...form, shareClass: event.currentTarget.value })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("columnKyc")}
                <select
                  className={fieldClassName}
                  value={form.kycStatus}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      kycStatus: event.currentTarget.value as KycStatus,
                    })
                  }
                >
                  <option value="PENDING">{t("kycStatus.PENDING")}</option>
                  <option value="UNDER_REVIEW">
                    {t("kycStatus.UNDER_REVIEW")}
                  </option>
                  <option value="APPROVED">{t("kycStatus.APPROVED")}</option>
                  <option value="REJECTED">{t("kycStatus.REJECTED")}</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isAccredited}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      isAccredited: event.currentTarget.checked,
                    })
                  }
                />
                {t("accredited")}
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                {t("remarks")}
                <textarea
                  rows={3}
                  className={fieldClassName}
                  value={form.remarks}
                  onChange={(event) =>
                    setForm({ ...form, remarks: event.currentTarget.value })
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isSaving
                  ? t("saving")
                  : editingProfile
                    ? t("saveChanges")
                    : t("create")}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
