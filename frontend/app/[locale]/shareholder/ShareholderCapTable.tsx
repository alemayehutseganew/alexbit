"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  AlertCircle,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Landmark,
  RefreshCw,
  UploadCloud,
  Users,
  Wallet,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type KycStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

type ShareholderDocument = {
  id: string;
  documentName: string;
  documentUrl: string | null;
  uploadedAt: string;
};

type ShareholderRecord = {
  id: string;
  tenantId: string;
  contactNo: string | null;
  tinNumber: string | null;
  numberOfShares: number;
  shareValue: string | number;
  totalContribution: string | number;
  datePaid: string | null;
  kycStatus: KycStatus;
  tenant: { id: string; name: string };
  documents: ShareholderDocument[];
};

type ShareholderCapTableProps = {
  accessToken: string;
  locale: string;
  canManage: boolean;
};

const tableFeaturesConfig = tableFeatures({});
const columnHelper = createColumnHelper<
  typeof tableFeaturesConfig,
  ShareholderRecord
>();
const kycStatusClasses: Record<KycStatus, string> = {
  PENDING: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  UNDER_REVIEW: "border-blue-300/20 bg-blue-300/10 text-blue-200",
  APPROVED: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  REJECTED: "border-red-300/20 bg-red-300/10 text-red-200",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDocument(value: unknown): value is ShareholderDocument {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.documentName === "string" &&
    (typeof value.documentUrl === "string" || value.documentUrl === null) &&
    typeof value.uploadedAt === "string"
  );
}

function isShareholder(value: unknown): value is ShareholderRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.tenantId === "string" &&
    (typeof value.contactNo === "string" || value.contactNo === null) &&
    (typeof value.tinNumber === "string" || value.tinNumber === null) &&
    typeof value.numberOfShares === "number" &&
    (typeof value.shareValue === "string" ||
      typeof value.shareValue === "number") &&
    (typeof value.totalContribution === "string" ||
      typeof value.totalContribution === "number") &&
    (typeof value.datePaid === "string" || value.datePaid === null) &&
    ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(
      String(value.kycStatus),
    ) &&
    isRecord(value.tenant) &&
    typeof value.tenant.id === "string" &&
    typeof value.tenant.name === "string" &&
    Array.isArray(value.documents) &&
    value.documents.every(isDocument)
  );
}

function formatCurrency(value: string | number, locale: string): string {
  const amount = Number(value);
  const formattedAmount = new Intl.NumberFormat(
    locale === "am" ? "am-ET" : "en-ET",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);

  return `ETB ${formattedAmount}`;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-ET", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function safeDocumentUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function shareholderDocumentUrl(
  document: ShareholderDocument,
  selectedShareholder: ShareholderRecord,
  apiUrl: string,
): string | null {
  if (document.documentUrl?.startsWith("local://")) {
    return `${apiUrl}/api/shareholder/${selectedShareholder.id}/documents/${document.id}/file`;
  }
  return safeDocumentUrl(document.documentUrl);
}

async function getResponseError(
  response: Response,
  fallback: string,
): Promise<string> {
  if (response.status >= 500) {
    return fallback;
  }

  const payload: unknown = await response.json().catch(() => null);
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  return fallback;
}

function LoadingTable({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <Skeleton className="h-7 w-56" />
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ShareholderCapTable({
  accessToken,
  locale,
  canManage,
}: ShareholderCapTableProps) {
  const t = useTranslations("ShareholderPortal");
  const [shareholders, setShareholders] = useState<ShareholderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedShareholderId, setSelectedShareholderId] = useState<
    string | null
  >(null);
  const [documentName, setDocumentName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedDocumentFile, setSelectedDocumentFile] =
    useState<File | null>(null);
  const [companyDocuments, setCompanyDocuments] = useState<
    Array<{
      id: string;
      documentName: string;
      documentUrl: string;
      uploadedAt: string;
    }>
  >([]);
  const [companyFile, setCompanyFile] = useState<File | null>(null);
  const [companyUploadError, setCompanyUploadError] = useState<string | null>(
    null,
  );
  const [companyUploading, setCompanyUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editForm, setEditForm] = useState({
    tinNumber: "",
    numberOfShares: "",
    totalContribution: "",
    datePaid: "",
    kycStatus: "PENDING" as KycStatus,
  });
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const [documentActionError, setDocumentActionError] = useState<string | null>(
    null,
  );
  const [viewingDocument, setViewingDocument] =
    useState<ShareholderDocument | null>(null);

  const loadShareholders = useCallback(
    async (signal: AbortSignal) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiUrl) {
        setError(t("apiNotConfigured"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/api/shareholder/all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
        });
        if (!response.ok) {
          throw new Error(await getResponseError(response, t("loadError")));
        }

        const result: unknown = await response.json();
        if (!Array.isArray(result) || !result.every(isShareholder)) {
          throw new Error(t("invalidResponse"));
        }
        setShareholders(result);
      } catch (loadError) {
        if (!signal.aborted) {
          setError(
            loadError instanceof Error ? loadError.message : t("loadError"),
          );
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadShareholders(controller.signal);
    return () => controller.abort();
  }, [loadShareholders, refreshKey]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) return;

    const controller = new AbortController();
    void fetch(`${apiUrl}/api/shareholder/company-documents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((result: unknown) => {
        if (
          Array.isArray(result) &&
          result.every(
            (item) =>
              isRecord(item) &&
              typeof item.id === "string" &&
              typeof item.documentName === "string" &&
              typeof item.documentUrl === "string" &&
              typeof item.uploadedAt === "string",
          )
        ) {
          setCompanyDocuments(
            result as Array<{
              id: string;
              documentName: string;
              documentUrl: string;
              uploadedAt: string;
            }>,
          );
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [accessToken, refreshKey]);

  const selectedShareholder =
    shareholders.find((item) => item.id === selectedShareholderId) ?? null;

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((row) => row.tenant.name, {
          id: "name",
          header: t("columnName"),
          cell: ({ row }) => (
            <span className="font-medium text-slate-900">
              {row.original.tenant.name}
            </span>
          ),
        }),
        columnHelper.accessor((row) => row.tinNumber, {
          id: "tin",
          header: t("columnTin"),
          cell: ({ row }) => row.original.tinNumber || "—",
        }),
        columnHelper.accessor("numberOfShares", {
          header: t("columnShares"),
          cell: ({ row }) =>
            row.original.numberOfShares.toLocaleString(
              locale === "am" ? "am-ET" : "en-ET",
            ),
        }),
        columnHelper.accessor("totalContribution", {
          header: t("columnContribution"),
          cell: ({ row }) =>
            formatCurrency(row.original.totalContribution, locale),
        }),
        columnHelper.accessor("datePaid", {
          header: t("columnDatePaid"),
          cell: ({ row }) => formatDate(row.original.datePaid, locale),
        }),
        columnHelper.accessor("kycStatus", {
          header: t("columnKyc"),
          cell: ({ row }) => {
            const status = row.original.kycStatus;
            return (
              <Badge variant="outline" className={kycStatusClasses[status]}>
                {t(`kycStatus.${status}`)}
              </Badge>
            );
          },
        }),
        columnHelper.accessor((row) => row.id, {
          id: "actions",
          header: t("columnActions"),
          cell: ({ row }) => (
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={t("viewDocumentsFor", {
                name: row.original.tenant.name,
              })}
              className="min-h-11 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setSelectedShareholderId(row.original.id);
                setDocumentName("");
                setDocumentUrl("");
                setSelectedFileName("");
                setUploadError(null);
                setUploadSuccess(false);
                setIsEditing(false);
                setEditError(null);
                setEditSuccess(false);
                setDocumentActionError(null);
                setViewingDocument(null);
                setEditForm({
                  tinNumber: row.original.tinNumber ?? "",
                  numberOfShares: String(row.original.numberOfShares),
                  totalContribution: String(row.original.totalContribution),
                  datePaid: row.original.datePaid
                    ? row.original.datePaid.slice(0, 10)
                    : "",
                  kycStatus: row.original.kycStatus,
                });
              }}
            >
              <FileText aria-hidden="true" size={15} />
              {t("viewDocuments")}
            </Button>
          ),
        }),
      ]),
    [locale, t],
  );

  const table = useTable({
    features: tableFeaturesConfig,
    columns,
    data: shareholders,
  });

  const totalShares = shareholders.reduce(
    (total, shareholder) => total + shareholder.numberOfShares,
    0,
  );
  const totalCapital = shareholders.reduce(
    (total, shareholder) => total + Number(shareholder.totalContribution),
    0,
  );

  const resetDialog = () => {
    setSelectedShareholderId(null);
    setDocumentName("");
    setDocumentUrl("");
    setSelectedFileName("");
    setUploadError(null);
    setUploadSuccess(false);
    setIsEditing(false);
    setEditError(null);
    setEditSuccess(false);
  };

  const setFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setSelectedDocumentFile(file);
    setDocumentName(file.name);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0]);
  };

  const onFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setFile(event.dataTransfer.files[0]);
  };

  const saveShareholder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShareholder) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setEditError(t("apiNotConfigured"));
      return;
    }

    setIsSaving(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const response = await fetch(
        `${apiUrl}/api/shareholder/${selectedShareholder.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tinNumber: editForm.tinNumber.trim() || null,
            numberOfShares: Number(editForm.numberOfShares),
            totalContribution: Number(editForm.totalContribution),
            datePaid: editForm.datePaid
              ? new Date(`${editForm.datePaid}T00:00:00.000Z`).toISOString()
              : null,
            kycStatus: editForm.kycStatus,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(await getResponseError(response, t("loadError")));
      }

      setEditSuccess(true);
      setIsEditing(false);
      setRefreshKey((key) => key + 1);
    } catch (updateFailure) {
      setEditError(
        updateFailure instanceof Error ? updateFailure.message : t("loadError"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDocument = async (document: ShareholderDocument) => {
    if (!selectedShareholder) {
      return;
    }
    if (!window.confirm(`Delete "${document.documentName}"?`)) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setDocumentActionError(t("apiNotConfigured"));
      return;
    }

    setDeletingDocumentId(document.id);
    setDocumentActionError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/shareholder/${selectedShareholder.id}/documents/${document.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        throw new Error(await getResponseError(response, t("uploadError")));
      }
      setViewingDocument(null);
      setRefreshKey((key) => key + 1);
    } catch (deleteFailure) {
      setDocumentActionError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : t("uploadError"),
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const submitDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShareholder || !documentName.trim()) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setUploadError(t("apiNotConfigured"));
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      let response: Response;
      if (selectedDocumentFile) {
        const formData = new FormData();
        formData.append("file", selectedDocumentFile);
        formData.append("documentName", documentName.trim());
        response = await fetch(
          `${apiUrl}/api/shareholder/${selectedShareholder.id}/documents/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          },
        );
      } else {
        response = await fetch(
          `${apiUrl}/api/shareholder/${selectedShareholder.id}/documents`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              documentName: documentName.trim(),
              ...(documentUrl.trim()
                ? { documentUrl: documentUrl.trim() }
                : {}),
            }),
          },
        );
      }
      if (!response.ok) {
        throw new Error(await getResponseError(response, t("uploadError")));
      }

      setUploadSuccess(true);
      setDocumentName("");
      setDocumentUrl("");
      setSelectedFileName("");
      setSelectedDocumentFile(null);
      setRefreshKey((key) => key + 1);
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : t("uploadError"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const submitCompanyDocument = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!companyFile) {
      setCompanyUploadError("Choose a company document first.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setCompanyUploadError(t("apiNotConfigured"));
      return;
    }

    const formData = new FormData();
    formData.append("file", companyFile);
    setCompanyUploading(true);
    setCompanyUploadError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/shareholder/company-documents/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      );
      if (!response.ok) {
        throw new Error(await getResponseError(response, t("uploadError")));
      }
      setCompanyFile(null);
      setRefreshKey((key) => key + 1);
    } catch (uploadFailure) {
      setCompanyUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : t("uploadError"),
      );
    } finally {
      setCompanyUploading(false);
    }
  };

  const statCards = [
    {
      label: t("totalShareholders"),
      value: shareholders.length.toLocaleString(
        locale === "am" ? "am-ET" : "en-ET",
      ),
      Icon: Users,
    },
    {
      label: t("totalSharesIssued"),
      value: totalShares.toLocaleString(locale === "am" ? "am-ET" : "en-ET"),
      Icon: Landmark,
    },
    {
      label: t("totalCapitalRaised"),
      value: formatCurrency(totalCapital, locale),
      Icon: Wallet,
    },
  ];

  return (
    <>
      <section className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Company documents
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Receipts and shared records
            </h2>
          </div>
          {canManage && (
            <form
              onSubmit={(event) => void submitCompanyDocument(event)}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) =>
                  setCompanyFile(event.target.files?.[0] ?? null)
                }
                className="block max-w-[220px] text-xs text-slate-600 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:text-xs file:font-semibold file:text-white"
              />
              <Button
                type="submit"
                disabled={companyUploading || !companyFile}
                className="min-h-10 bg-brand-600 text-white hover:bg-brand-500"
              >
                <UploadCloud aria-hidden="true" size={15} />
                {companyUploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          )}
        </div>
        {companyUploadError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {companyUploadError}
          </p>
        )}
        {companyDocuments.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {companyDocuments.map((document) => {
              const apiUrl =
                process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
              const href = `${apiUrl}/api/shareholder/company-documents/${document.id}/file`;
              return (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText
                      aria-hidden="true"
                      className="shrink-0 text-brand-600"
                      size={18}
                    />
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-900">
                        {document.documentName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t("uploadedAt", {
                          date: formatDate(document.uploadedAt, locale),
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const response = await fetch(href, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                      });
                      if (!response.ok) return;
                      const blob = await response.blob();
                      const objectUrl = URL.createObjectURL(blob);
                      const anchor = window.document.createElement("a");
                      anchor.href = objectUrl;
                      anchor.download = document.documentName;
                      anchor.click();
                      URL.revokeObjectURL(objectUrl);
                    }}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download aria-hidden="true" size={14} />
                    Download
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600">
            No company documents have been uploaded.
          </p>
        )}
      </section>

      <section
        aria-label={t("capTableMetrics")}
        className="grid gap-4 sm:grid-cols-3"
      >
        {statCards.map(({ label, value, Icon }) => (
          <article
            key={label}
            className="premium-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">{label}</p>
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <Icon aria-hidden="true" size={19} />
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="mt-4 h-8 w-36" />
            ) : (
              <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-xl lg:text-2xl">
                {value}
              </p>
            )}
          </article>
        ))}
      </section>

      <section
        id="cap-table"
        className="premium-card scroll-mt-28 overflow-hidden"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              {t("capTableEyebrow")}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {t("capTableHeading")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("capTableDescription")}
            </p>
          </div>
          {!isLoading && !error && (
            <p className="text-sm text-slate-600">
              {t("shareholderCount", { count: shareholders.length })}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="p-5">
            <LoadingTable label={t("loadingRecords")} />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="m-5 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle aria-hidden="true" size={18} />
            <span className="min-w-0 flex-1">{error}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="min-h-11 border-slate-200 text-slate-700"
            >
              <RefreshCw aria-hidden="true" size={15} />
              {t("retry")}
            </Button>
          </div>
        ) : (
          <Table className="min-w-[900px] text-slate-700">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-slate-200 bg-slate-100 hover:bg-slate-100"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-700"
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-slate-200 hover:bg-slate-50"
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-4 text-sm text-slate-700"
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {shareholders.length === 0 && (
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-sm text-slate-600"
                  >
                    {t("noShareholders")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog
        open={selectedShareholder !== null}
        onOpenChange={(open) => {
          if (!open) {
            resetDialog();
          }
        }}
      >
        {selectedShareholder && (
          <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-0 bg-white p-0 text-slate-900 shadow-[0_30px_100px_rgba(2,6,23,0.45)] ring-1 ring-slate-200 sm:max-w-2xl">
            <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-6 pr-16 text-slate-900 sm:px-7">
              <div className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-brand-300/20 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-brand-50 text-brand-600 shadow-sm">
                  <FolderOpen aria-hidden="true" size={22} />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-xl font-semibold text-slate-900">
                    {t("documentsFor", {
                      name: selectedShareholder.tenant.name,
                    })}
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-sm text-slate-600">
                    {t("documentVaultDescription")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 p-5 sm:p-7">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("documentsListTitle")}
                  </h3>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {selectedShareholder.documents.length}
                  </span>
                </div>
                {selectedShareholder.documents.length > 0 ? (
                  <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {selectedShareholder.documents.map((document) => {
                      const href = shareholderDocumentUrl(
                        document,
                        selectedShareholder,
                        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
                          "",
                      );
                      return (
                        <li
                          key={document.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3 py-1">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                              <FileText aria-hidden="true" size={18} />
                            </span>
                            <div className="min-w-0">
                              {href ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="break-all text-sm font-semibold text-slate-900 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                  {document.documentName}
                                </a>
                              ) : (
                                <p className="break-all text-sm font-semibold text-slate-900">
                                  {document.documentName}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-slate-500">
                                {t("uploadedAt", {
                                  date: formatDate(document.uploadedAt, locale),
                                })}
                              </p>
                            </div>
                          </div>
                          {href && (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingDocument(document)}
                                className="min-h-9 border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Eye aria-hidden="true" size={14} />
                                View
                              </Button>
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${document.documentName}`}
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <ExternalLink aria-hidden="true" size={14} />
                              </a>
                              <a
                                href={href}
                                download
                                aria-label={`Download ${document.documentName}`}
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Download aria-hidden="true" size={14} />
                              </a>
                              {canManage && (
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="outline"
                                  disabled={deletingDocumentId === document.id}
                                  aria-label={`Delete ${document.documentName}`}
                                  onClick={() => void deleteDocument(document)}
                                  className="size-9 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 aria-hidden="true" size={14} />
                                </Button>
                              )}
                            </div>
                          )}
                          {!href && canManage && (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              disabled={deletingDocumentId === document.id}
                              aria-label={`Delete ${document.documentName}`}
                              onClick={() => void deleteDocument(document)}
                              className="size-9 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 aria-hidden="true" size={14} />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    {t("noDocuments")}
                  </p>
                )}
                {documentActionError && (
                  <p role="alert" className="mt-3 text-sm text-red-600">
                    {documentActionError}
                  </p>
                )}
              </div>

              {canManage && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        KYC and ownership
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Superadmin controls
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing((editing) => !editing);
                        setEditError(null);
                        setEditSuccess(false);
                      }}
                      className="min-h-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    >
                      {isEditing ? "Cancel" : "Edit shareholder"}
                    </Button>
                  </div>

                  {isEditing && (
                    <form
                      onSubmit={(event) => void saveShareholder(event)}
                      className="mt-4 grid gap-3 sm:grid-cols-2"
                    >
                      <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                        TIN
                        <Input
                          value={editForm.tinNumber}
                          onChange={(event) =>
                            setEditForm((form) => ({
                              ...form,
                              tinNumber: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 border-slate-200 bg-white text-slate-900"
                        />
                      </label>
                      <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                        KYC status
                        <select
                          value={editForm.kycStatus}
                          onChange={(event) =>
                            setEditForm((form) => ({
                              ...form,
                              kycStatus: event.target.value as KycStatus,
                            }))
                          }
                          className="mt-1 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                        >
                          {(
                            [
                              "PENDING",
                              "UNDER_REVIEW",
                              "APPROVED",
                              "REJECTED",
                            ] as const
                          ).map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                        Number of shares
                        <Input
                          required
                          type="number"
                          min="0"
                          step="1"
                          value={editForm.numberOfShares}
                          onChange={(event) =>
                            setEditForm((form) => ({
                              ...form,
                              numberOfShares: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 border-slate-200 bg-white text-slate-900"
                        />
                      </label>
                      <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                        Total contribution
                        <Input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.totalContribution}
                          onChange={(event) =>
                            setEditForm((form) => ({
                              ...form,
                              totalContribution: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 border-slate-200 bg-white text-slate-900"
                        />
                      </label>
                      <label className="space-y-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
                        Date paid
                        <Input
                          type="date"
                          value={editForm.datePaid}
                          onChange={(event) =>
                            setEditForm((form) => ({
                              ...form,
                              datePaid: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 border-slate-200 bg-white text-slate-900"
                        />
                      </label>
                      {editError && (
                        <p
                          role="alert"
                          className="text-sm text-red-600 sm:col-span-2"
                        >
                          {editError}
                        </p>
                      )}
                      <div className="flex justify-end sm:col-span-2">
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="min-h-11 bg-brand-600 text-white hover:bg-brand-500"
                        >
                          {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </form>
                  )}
                  {editSuccess && (
                    <p
                      role="status"
                      className="mt-3 text-sm font-medium text-emerald-600"
                    >
                      Shareholder updated successfully.
                    </p>
                  )}
                </div>
              )}

              {canManage ? (
                <form
                  onSubmit={(event) => void submitDocument(event)}
                  className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t("addDocument")}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {t("mockUploadDescription")}
                    </p>
                  </div>
                  <label
                    htmlFor="shareholder-document-file"
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onFileDrop}
                    className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition focus-within:ring-2 focus-within:ring-blue-400 ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40"
                    }`}
                  >
                    <UploadCloud
                      aria-hidden="true"
                      className="mb-2 text-blue-600"
                      size={22}
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedFileName || t("dropDocument")}
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      {t("dropDocumentHint")}
                    </span>
                    <input
                      id="shareholder-document-file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={onFileChange}
                      className="sr-only"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                      {t("documentName")}
                      <Input
                        required
                        maxLength={120}
                        value={documentName}
                        onChange={(event) =>
                          setDocumentName(event.target.value)
                        }
                        className="mt-1 min-h-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                      {t("documentUrl")}{" "}
                      <span className="font-normal text-slate-400">
                        (Optional)
                      </span>
                      <Input
                        type="url"
                        value={documentUrl}
                        onChange={(event) => setDocumentUrl(event.target.value)}
                        placeholder="https://..."
                        className="mt-1 min-h-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      />
                    </label>
                  </div>

                  {uploadError && (
                    <p role="alert" className="text-sm text-red-700">
                      {uploadError}
                    </p>
                  )}
                  {uploadSuccess && (
                    <p role="status" className="text-sm text-emerald-700">
                      {t("documentAdded")}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUploading || !documentName.trim()}
                      className="min-h-11 bg-brand-600 text-white hover:bg-brand-500"
                    >
                      <UploadCloud aria-hidden="true" size={16} />
                      {isUploading ? t("uploading") : t("uploadDocument")}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {t("uploadOwnProfileOnly")}
                </p>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
      <Dialog
        open={viewingDocument !== null}
        onOpenChange={(open) => {
          if (!open) setViewingDocument(null);
        }}
      >
        {viewingDocument && (
          <DialogContent className="h-[88vh] max-h-[88vh] gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 text-slate-900 shadow-[0_30px_100px_rgba(2,6,23,0.25)] ring-1 ring-slate-200 sm:max-w-5xl">
            <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 pr-14 sm:px-6">
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-semibold text-slate-900">
                  {viewingDocument.documentName}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-slate-600">
                  Secure document preview
                </DialogDescription>
              </div>
              {safeDocumentUrl(viewingDocument.documentUrl) && (
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={
                      safeDocumentUrl(viewingDocument.documentUrl) ?? undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink aria-hidden="true" size={14} />
                    Open
                  </a>
                  <a
                    href={
                      safeDocumentUrl(viewingDocument.documentUrl) ?? undefined
                    }
                    download
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-500"
                  >
                    <Download aria-hidden="true" size={14} />
                    Download
                  </a>
                </div>
              )}
            </DialogHeader>
            <div className="relative h-[calc(88vh-73px)] bg-slate-100">
              {(() => {
                const href = safeDocumentUrl(viewingDocument.documentUrl);
                if (!href) return null;
                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(href);
                return isImage ? (
                  <Image
                    src={href}
                    alt={viewingDocument.documentName}
                    fill
                    sizes="100vw"
                    unoptimized
                    className="size-full object-contain"
                  />
                ) : (
                  <iframe
                    src={href}
                    title={viewingDocument.documentName}
                    className="size-full border-0"
                    referrerPolicy="no-referrer"
                  />
                );
              })()}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
