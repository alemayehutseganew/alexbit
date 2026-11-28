"use client";

import {
  Building2,
  Eye,
  FileText,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const maxDocumentSize = 10 * 1024 * 1024;
const allowedDocumentTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

type ShareholderDocument = {
  id: string;
  documentName: string;
  documentUrl: string | null;
  uploadedAt: string;
};

type ShareholderProfile = {
  id: string;
  tenant: { name: string };
  documents: ShareholderDocument[];
};

type CompanyDocument = {
  id: string;
  documentName: string;
  documentUrl: string;
  uploadedByTenantId: string;
  uploadedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isShareholderDocument(value: unknown): value is ShareholderDocument {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.documentName === "string" &&
    (typeof value.documentUrl === "string" || value.documentUrl === null) &&
    typeof value.uploadedAt === "string"
  );
}

function isShareholderProfile(value: unknown): value is ShareholderProfile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isRecord(value.tenant) &&
    typeof value.tenant.name === "string" &&
    Array.isArray(value.documents) &&
    value.documents.every(isShareholderDocument)
  );
}

function isCompanyDocument(value: unknown): value is CompanyDocument {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.documentName === "string" &&
    typeof value.documentUrl === "string" &&
    typeof value.uploadedByTenantId === "string" &&
    typeof value.uploadedAt === "string"
  );
}

async function responseError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (isRecord(payload)) {
    if (typeof payload.message === "string") {
      return payload.message;
    }
    if (
      Array.isArray(payload.message) &&
      payload.message.every((item) => typeof item === "string")
    ) {
      return payload.message.join(", ");
    }
  }
  return `Request failed (HTTP ${response.status}).`;
}

function openPreviewWindow(): Window | null {
  const previewWindow = window.open("about:blank", "_blank");
  if (previewWindow) {
    previewWindow.opener = null;
  }
  return previewWindow;
}

function showBlobPreview(previewWindow: Window, blob: Blob) {
  const fileUrl = URL.createObjectURL(blob);
  previewWindow.location.replace(fileUrl);
  const cleanupInterval = window.setInterval(() => {
    if (previewWindow.closed) {
      window.clearInterval(cleanupInterval);
      URL.revokeObjectURL(fileUrl);
    }
  }, 1000);
}

export default function ShareholderDocumentsPage() {
  const { data: session, status } = useSession();
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations("ShareholderPortal");
  const [shareholders, setShareholders] = useState<ShareholderProfile[]>([]);
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompanyDocuments, setIsLoadingCompanyDocuments] =
    useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [companyDocumentsError, setCompanyDocumentsError] = useState<
    string | null
  >(null);
  const [companyDocumentsMessage, setCompanyDocumentsMessage] = useState<
    string | null
  >(null);
  const [isUploadingCompanyDocument, setIsUploadingCompanyDocument] =
    useState(false);
  const [openingCompanyDocumentId, setOpeningCompanyDocumentId] =
    useState<string | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [openingShareholderDocumentId, setOpeningShareholderDocumentId] =
    useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const accessToken = session?.accessToken;
  const role = session?.user?.role;
  const isSharedReadOnlyAccount =
    session?.user?.email?.trim().toLowerCase() ===
    "shareholder@primehorizon.com";
  const canViewDocuments = [
    "SHAREHOLDER",
    "SHAREHOLDER_ADMIN",
    "SHAREHOLDER_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
  ].includes(role ?? "");
  const canManageDocuments =
    !isSharedReadOnlyAccount &&
    (role === "SHAREHOLDER_ADMIN" ||
      role === "SHAREHOLDER_MANAGER" ||
      role === "SUPER_ADMIN" ||
      role === "ADMIN");
  const canManageCompanyDocuments =
    !isSharedReadOnlyAccount &&
    (role === "SHAREHOLDER_ADMIN" ||
      role === "SUPER_ADMIN" ||
      role === "ADMIN");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/${locale}/login?realm=shareholder`);
    }
  }, [locale, router, status]);

  const loadShareholders = useCallback(
    async (signal: AbortSignal) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiUrl) {
        setLoadError("NEXT_PUBLIC_API_URL is not configured.");
        setIsLoading(false);
        return;
      }
      if (!accessToken) {
        setLoadError("Your session is missing an API access token.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${apiUrl}/api/shareholder/all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
        });
        if (!response.ok) {
          throw new Error(await responseError(response));
        }

        const result: unknown = await response.json();
        if (!Array.isArray(result) || !result.every(isShareholderProfile)) {
          throw new Error("The shareholder API returned invalid data.");
        }
        setShareholders(result);
      } catch (error) {
        if (!signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load documents.",
          );
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [accessToken],
  );

  const loadCompanyDocuments = useCallback(
    async (signal: AbortSignal) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiUrl) {
        setCompanyDocumentsError("NEXT_PUBLIC_API_URL is not configured.");
        setIsLoadingCompanyDocuments(false);
        return;
      }
      if (!accessToken) {
        setCompanyDocumentsError(
          "Your session is missing an API access token.",
        );
        setIsLoadingCompanyDocuments(false);
        return;
      }

      setIsLoadingCompanyDocuments(true);
      setCompanyDocumentsError(null);
      try {
        const response = await fetch(
          `${apiUrl}/api/shareholder/company-documents`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal,
          },
        );
        if (!response.ok) {
          throw new Error(await responseError(response));
        }

        const result: unknown = await response.json();
        if (!Array.isArray(result) || !result.every(isCompanyDocument)) {
          throw new Error("The company documents API returned invalid data.");
        }
        setCompanyDocuments(result);
      } catch (error) {
        if (!signal.aborted) {
          setCompanyDocumentsError(
            error instanceof Error
              ? error.message
              : "Unable to load company documents.",
          );
        }
      } finally {
        if (!signal.aborted) {
          setIsLoadingCompanyDocuments(false);
        }
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    if (!canViewDocuments) {
      setIsLoading(false);
      setIsLoadingCompanyDocuments(false);
      return;
    }
    const controller = new AbortController();
    void loadShareholders(controller.signal);
    void loadCompanyDocuments(controller.signal);
    return () => controller.abort();
  }, [
    canViewDocuments,
    loadCompanyDocuments,
    loadShareholders,
    refreshKey,
    status,
  ]);

  async function uploadDocument(profileId: string, file: File) {
    if (!canManageDocuments || !accessToken) {
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setMutationError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }
    if (file.size > maxDocumentSize) {
      setMutationError(t("companyDocumentTooLarge"));
      return;
    }
    if (!allowedDocumentTypes.has(file.type)) {
      setMutationError(t("supportedDocumentTypes"));
      return;
    }

    setBusyProfileId(profileId);
    setMutationError(null);
    setMutationMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${apiUrl}/api/shareholder/${profileId}/documents/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      );
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      setMutationMessage(t("shareholderDocumentUploaded"));
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : t("shareholderDocumentUploadError"),
      );
    } finally {
      setBusyProfileId(null);
    }
  }

  async function viewShareholderDocument(
    profileId: string,
    document: ShareholderDocument,
  ) {
    if (!accessToken) {
      setMutationError("Your session is missing an API access token.");
      return;
    }

    const documentUrl = document.documentUrl;
    if (documentUrl && /^https?:\/\//i.test(documentUrl)) {
      const previewWindow = openPreviewWindow();
      if (!previewWindow) {
        setMutationError(t("documentPreviewPopupBlocked"));
        return;
      }
      previewWindow.location.replace(documentUrl);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setMutationError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }

    const previewWindow = openPreviewWindow();
    if (!previewWindow) {
      setMutationError(t("documentPreviewPopupBlocked"));
      return;
    }

    setOpeningShareholderDocumentId(document.id);
    setMutationError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/shareholder/${profileId}/documents/${document.id}/file`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      showBlobPreview(previewWindow, await response.blob());
    } catch (error) {
      previewWindow.close();
      setMutationError(
        error instanceof Error
          ? error.message
          : t("shareholderDocumentPreviewError"),
      );
    } finally {
      setOpeningShareholderDocumentId(null);
    }
  }

  async function uploadCompanyDocument(file: File) {
    if (!canManageCompanyDocuments || !accessToken) {
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setCompanyDocumentsError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }
    if (file.size > maxDocumentSize) {
      setCompanyDocumentsError(t("companyDocumentTooLarge"));
      return;
    }
    if (!allowedDocumentTypes.has(file.type)) {
      setCompanyDocumentsError(t("supportedDocumentTypes"));
      return;
    }

    setIsUploadingCompanyDocument(true);
    setCompanyDocumentsError(null);
    setCompanyDocumentsMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${apiUrl}/api/shareholder/company-documents/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      );
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      setCompanyDocumentsMessage(t("companyDocumentUploaded"));
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setCompanyDocumentsError(
        error instanceof Error
          ? error.message
          : t("companyDocumentUploadError"),
      );
    } finally {
      setIsUploadingCompanyDocument(false);
    }
  }

  async function viewCompanyDocument(document: CompanyDocument) {
    if (!accessToken) {
      setCompanyDocumentsError("Your session is missing an API access token.");
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setCompanyDocumentsError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }

    const previewWindow = openPreviewWindow();
    if (!previewWindow) {
      setCompanyDocumentsError(t("documentPreviewPopupBlocked"));
      return;
    }

    setOpeningCompanyDocumentId(document.id);
    setCompanyDocumentsError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/shareholder/company-documents/${document.id}/file`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      showBlobPreview(previewWindow, await response.blob());
    } catch (error) {
      previewWindow.close();
      setCompanyDocumentsError(
        error instanceof Error
          ? error.message
          : t("companyDocumentPreviewError"),
      );
    } finally {
      setOpeningCompanyDocumentId(null);
    }
  }

  async function deleteDocument(
    profileId: string,
    document: ShareholderDocument,
  ) {
    if (!canManageDocuments || !accessToken) {
      return;
    }
    if (
      !window.confirm(
        t("deleteDocumentConfirm", { name: document.documentName }),
      )
    ) {
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setMutationError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }

    setBusyDocumentId(document.id);
    setMutationError(null);
    setMutationMessage(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/shareholder/${profileId}/documents/${document.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      setMutationMessage(t("documentDeleted"));
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to delete document.",
      );
    } finally {
      setBusyDocumentId(null);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p role="status" className="text-sm text-slate-600">
          {t("shareholderDocumentsLoading")}
        </p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!canViewDocuments) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {t("permissionDeniedDocuments")}
      </p>
    );
  }

  return (
    <div id="kyc-documents" className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-brand-800 to-blue-900 p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
          {t("portalName")}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("kycDocuments")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
          {t("kycPageDescription")}
        </p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <Building2 aria-hidden="true" size={23} />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                {t("companyDocumentsTitle")}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                {t("companyDocumentsDescription")}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {t("fileSizeHint")}
              </p>
            </div>
          </div>
          {canManageCompanyDocuments && (
            <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-blue-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/15 transition hover:-translate-y-0.5 hover:shadow-xl has-[:disabled]:cursor-wait has-[:disabled]:opacity-70">
              {isUploadingCompanyDocument ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                />
              ) : (
                <UploadCloud aria-hidden="true" size={17} />
              )}
              {isUploadingCompanyDocument
                ? t("companyDocumentUploading")
                : t("uploadCompanyDocument")}
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                disabled={isUploadingCompanyDocument}
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) {
                    void uploadCompanyDocument(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
          )}
        </div>

        {companyDocumentsError && (
          <p
            role="alert"
            className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:mx-7"
          >
            {companyDocumentsError}
          </p>
        )}
        {companyDocumentsMessage && (
          <p
            role="status"
            className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 sm:mx-7"
          >
            {companyDocumentsMessage}
          </p>
        )}

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-3">
          {isLoadingCompanyDocuments ? (
            <p role="status" className="text-sm text-slate-500">
              {t("companyDocumentsLoading")}
            </p>
          ) : companyDocuments.length > 0 ? (
            companyDocuments.map((document) => (
              <article
                key={document.id}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-brand-700">
                  <FileText aria-hidden="true" size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {document.documentName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat(
                      locale === "am" ? "am-ET" : "en-ET",
                      { dateStyle: "medium", timeZone: "UTC" },
                    ).format(new Date(document.uploadedAt))}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={openingCompanyDocumentId === document.id}
                  onClick={() => void viewCompanyDocument(document)}
                  aria-label={`${t("openDocument")} ${document.documentName}`}
                  title={t("openDocument")}
                  className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                >
                  {openingCompanyDocumentId === document.id ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={17}
                    />
                  ) : (
                    <Eye aria-hidden="true" size={17} />
                  )}
                </button>
              </article>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
              {t("companyDocumentsEmpty")}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              {t("shareholderRecordsEyebrow")}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              {t("kycDocuments")}
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {t("shareholderKycDescription")}
          </p>
        </header>

      {canManageDocuments && (
        <p className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900">
          {t("documentManagementPermission")}
        </p>
      )}
      {loadError && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {loadError}
        </p>
      )}
      {mutationError && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {mutationError}
        </p>
      )}
      {mutationMessage && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {mutationMessage}
        </p>
      )}

      <div className="space-y-4">
        {shareholders.map((shareholder) => (
          <section
            key={shareholder.id}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5"
          >
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <FileText aria-hidden="true" size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-950">
                    {shareholder.tenant.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("documentCount", {
                      count: shareholder.documents.length,
                    })}
                  </p>
                </div>
              </div>
              {canManageDocuments && (
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-800">
                  <UploadCloud aria-hidden="true" size={16} />
                  {busyProfileId === shareholder.id
                    ? t("uploadingDocument")
                    : t("uploadKycDocument")}
                  <input
                    aria-label={`Upload document for ${shareholder.tenant.name}`}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    disabled={busyProfileId !== null}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadDocument(shareholder.id, file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              )}
            </header>
            <ul className="divide-y divide-slate-100 px-5 sm:px-6">
              {shareholder.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {document.documentName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Intl.DateTimeFormat(
                        locale === "am" ? "am-ET" : "en-ET",
                        { dateStyle: "medium", timeZone: "UTC" },
                      ).format(new Date(document.uploadedAt))}
                    </p>
                  </div>
                  {document.documentUrl && (
                    <button
                      type="button"
                      disabled={
                        openingShareholderDocumentId === document.id
                      }
                      onClick={() =>
                        void viewShareholderDocument(
                          shareholder.id,
                          document,
                        )
                      }
                      aria-label={`${t("openDocument")} ${document.documentName}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                    >
                      {openingShareholderDocumentId === document.id ? (
                        <LoaderCircle
                          aria-hidden="true"
                          className="animate-spin"
                          size={15}
                        />
                      ) : (
                        <Eye aria-hidden="true" size={15} />
                      )}
                      {t("openDocument")}
                    </button>
                  )}
                  {canManageDocuments && (
                    <button
                      type="button"
                      disabled={busyDocumentId !== null}
                      onClick={() =>
                        void deleteDocument(shareholder.id, document)
                      }
                      className="rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyDocumentId === document.id
                        ? t("deletingDocument")
                        : t("delete")}
                    </button>
                  )}
                </li>
              ))}
              {shareholder.documents.length === 0 && (
                <li className="py-5 text-sm text-slate-500">
                  {t("noDocumentsForShareholder")}
                </li>
              )}
            </ul>
          </section>
        ))}
        {!loadError && shareholders.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            {t("noShareholders")}
          </p>
        )}
      </div>
      </section>
    </div>
  );
}
