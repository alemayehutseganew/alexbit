"use client";

import { Download, FileText, UploadCloud } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type ClientDocument = {
  id: string;
  documentName: string;
  uploadedAt: string;
};

const maxDocumentSize = 5 * 1024 * 1024;

function isClientDocument(value: unknown): value is ClientDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "documentName" in value &&
    typeof value.documentName === "string" &&
    "uploadedAt" in value &&
    typeof value.uploadedAt === "string"
  );
}

async function getUploadError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return `Unable to upload document (HTTP ${response.status}).`;
}

export function ClientDocuments({
  apiUrl,
  accessToken,
  locale,
  title,
  hint,
}: {
  apiUrl: string;
  accessToken: string;
  locale: string;
  title: string;
  hint: string;
}) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDocuments() {
      try {
        const response = await fetch(
          `${apiUrl.replace(/\/$/, "")}/api/client/documents`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
            cache: "no-store",
          },
        );
        if (!response.ok) {
          throw new Error("Unable to load documents.");
        }
        const value: unknown = await response.json();
        if (Array.isArray(value) && value.every(isClientDocument)) {
          setDocuments(value);
        } else {
          throw new Error("The server returned an invalid document response.");
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load documents.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();
    return () => controller.abort();
  }, [apiUrl, accessToken]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    const form = event.currentTarget;
    if (file.size > maxDocumentSize) {
      setError("Choose a file no larger than 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, "")}/api/client/documents/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      );
      if (!response.ok) throw new Error(await getUploadError(response));
      const uploaded: unknown = await response.json();
      if (!isClientDocument(uploaded)) {
        throw new Error("The server returned an invalid document response.");
      }

      setDocuments((current) => [
        uploaded,
        ...current.filter((document) => document.id !== uploaded.id),
      ]);
      setFile(null);
      form.reset();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload document.",
      );
    } finally {
      setUploading(false);
    }
  };

  const download = async (document: ClientDocument) => {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/client/documents/${document.id}/file`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = document.documentName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="min-h-screen p-6">
      <section className="premium-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">{title}</h2>
        <form
          onSubmit={(event) => void submit(event)}
          className="mb-8 rounded-xl border border-dashed border-slate-300 p-6"
        >
          <label className="flex cursor-pointer flex-col items-center text-center">
            <UploadCloud className="mb-3 text-brand-600" size={28} />
            <span className="text-sm font-semibold text-slate-700">
              {file?.name || hint}
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
          <button
            type="submit"
            disabled={!file || uploading}
            className="mt-5 w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload document"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}
        {isLoading ? (
          <div
            role="status"
            aria-label="Loading documents"
            className="space-y-3"
          >
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-16 rounded-xl" />
            ))}
            <span className="sr-only">Loading documents</span>
          </div>
        ) : documents.length ? (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="shrink-0 text-brand-600" size={18} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {document.documentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat(
                        locale === "am" ? "am-ET" : "en-ET",
                        {
                          dateStyle: "medium",
                        },
                      ).format(new Date(document.uploadedAt))}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void download(document)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                >
                  <Download size={14} /> Download
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        )}
      </section>
    </div>
  );
}
