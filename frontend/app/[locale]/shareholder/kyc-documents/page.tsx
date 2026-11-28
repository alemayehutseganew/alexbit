"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

async function responseError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }
  return `Request failed (HTTP ${response.status}).`;
}

export default function ShareholderDocumentsPage() {
  const { data: session, status } = useSession();
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [shareholders, setShareholders] = useState<ShareholderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const accessToken = session?.accessToken;
  const role = session?.user?.role;
  const canViewDocuments = [
    "SHAREHOLDER",
    "SHAREHOLDER_ADMIN",
    "SHAREHOLDER_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
  ].includes(role ?? "");
  const canManageDocuments =
    role === "SHAREHOLDER_ADMIN" ||
    role === "SHAREHOLDER_MANAGER" ||
    role === "SUPER_ADMIN" ||
    role === "ADMIN";

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

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    if (!canViewDocuments) {
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    void loadShareholders(controller.signal);
    return () => controller.abort();
  }, [canViewDocuments, loadShareholders, refreshKey, status]);

  async function uploadDocument(profileId: string, file: File) {
    if (!canManageDocuments || !accessToken) {
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setMutationError("NEXT_PUBLIC_API_URL is not configured.");
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
      setMutationMessage("Document uploaded.");
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to upload document.",
      );
    } finally {
      setBusyProfileId(null);
    }
  }

  async function deleteDocument(
    profileId: string,
    document: ShareholderDocument,
  ) {
    if (!canManageDocuments || !accessToken) {
      return;
    }
    if (!window.confirm(`Delete "${document.documentName}"?`)) {
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
      setMutationMessage("Document deleted.");
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
          Loading shareholder documents…
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
        You do not have permission to view shareholder documents.
      </p>
    );
  }

  return (
    <div id="kyc-documents" className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Shareholder Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          KYC Documents
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          View shareholder documents and their upload dates.
        </p>
      </header>

      {canManageDocuments && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          You can upload and delete documents.
        </p>
      )}
      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {loadError}
        </p>
      )}
      {mutationError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {mutationError}
        </p>
      )}
      {mutationMessage && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {mutationMessage}
        </p>
      )}

      <div className="space-y-5">
        {shareholders.map((shareholder) => (
          <section
            key={shareholder.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">
                {shareholder.tenant.name}
              </h2>
              {canManageDocuments && (
                <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                  {busyProfileId === shareholder.id
                    ? "Uploading…"
                    : "Upload document"}
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
            <ul className="divide-y divide-slate-100">
              {shareholder.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-5"
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
                  {canManageDocuments && (
                    <button
                      type="button"
                      disabled={busyDocumentId !== null}
                      onClick={() =>
                        void deleteDocument(shareholder.id, document)
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyDocumentId === document.id ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </li>
              ))}
              {shareholder.documents.length === 0 && (
                <li className="p-5 text-sm text-slate-500">
                  No documents uploaded.
                </li>
              )}
            </ul>
          </section>
        ))}
        {!loadError && shareholders.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No shareholder records found.
          </p>
        )}
      </div>
    </div>
  );
}
