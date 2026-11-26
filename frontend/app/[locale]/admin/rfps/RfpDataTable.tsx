"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { MoreHorizontal, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  isRfpStatus,
  RFP_STATUSES,
  type RfpRecord,
  type RfpStatus,
} from "./types";

const sectorLabels: Record<string, string> = {
  EDUCATION: "Education",
  IT_SUPPORT: "IT Support",
  WEB_SOFTWARE: "Web & Software",
  TELECOM: "Telecom",
  SOLAR_ELECTRICAL: "Solar & Electrical",
  POWER_GEN: "Power Generation",
};

const statusLabels: Record<RfpStatus, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  PROPOSAL_SENT: "Proposal Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const statusBadgeClasses: Record<RfpStatus, string> = {
  PENDING: "border-amber-200 bg-amber-100 text-amber-800",
  UNDER_REVIEW: "border-blue-200 bg-blue-100 text-blue-800",
  PROPOSAL_SENT: "border-violet-200 bg-violet-100 text-violet-800",
  ACCEPTED: "border-green-200 bg-green-100 text-green-800",
  REJECTED: "border-red-200 bg-red-100 text-red-800",
};

const columns: LegacyColumnDef<RfpRecord>[] = [
  { accessorKey: "organization", header: "Organization Name" },
  { accessorKey: "contactName", header: "Contact Name & Email" },
  { accessorKey: "sector", header: "Sector" },
  { accessorKey: "createdAt", header: "Date Received" },
  { accessorKey: "status", header: "Status" },
  { id: "actions", header: "Actions" },
];

type RfpDataTableProps = {
  rfps: RfpRecord[];
  locale: string;
  accessToken: string;
  onStatusUpdated: () => void;
};

type RfpActionsProps = {
  rfp: RfpRecord;
  onView: () => void;
  onUpdateStatus: () => void;
  onDownload: () => void;
};

function RfpActions({
  rfp,
  onView,
  onUpdateStatus,
  onDownload,
}: RfpActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${rfp.organization}`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onView}>View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={onUpdateStatus}>
          Update Status
        </DropdownMenuItem>
        {rfp.status === "ACCEPTED" && (
          <DropdownMenuItem onClick={onDownload}>
            Download Proposal PDF
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date);
}

export function RfpDataTable({
  rfps,
  locale,
  accessToken,
  onStatusUpdated,
}: RfpDataTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RfpStatus>("ALL");
  const [detailsRfp, setDetailsRfp] = useState<RfpRecord | null>(null);
  const [statusRfp, setStatusRfp] = useState<RfpRecord | null>(null);
  const [newStatus, setNewStatus] = useState<RfpStatus>("PENDING");
  const [isSaving, setIsSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!successToast) {
      return;
    }

    const timeout = window.setTimeout(() => setSuccessToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [successToast]);

  const filteredRfps = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return rfps.filter((rfp) => {
      const matchesOrganization = rfp.organization
        .toLowerCase()
        .includes(normalizedSearch);
      return (
        matchesOrganization &&
        (statusFilter === "ALL" || rfp.status === statusFilter)
      );
    });
  }, [rfps, search, statusFilter]);

  const table = useLegacyTable({
    data: filteredRfps,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function openStatusDialog(rfp: RfpRecord) {
    setUpdateError(null);
    setNewStatus(rfp.status);
    setStatusRfp(rfp);
  }

  async function handleStatusUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!statusRfp) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setUpdateError("The API URL is not configured.");
      return;
    }

    setIsSaving(true);
    setUpdateError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/rfp/${encodeURIComponent(statusRfp.id)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Unable to update the RFP status."),
        );
      }

      setStatusRfp(null);
      if (newStatus === "ACCEPTED" && statusRfp.status !== "ACCEPTED") {
        setSuccessToast("RFP Accepted. Project created in Client Portal.");
      }
      onStatusUpdated();
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Unable to update the RFP status.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function downloadProposal(rfpId: string) {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
      "http://localhost:3001";
    setDownloadError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/documents/proposal/${encodeURIComponent(rfpId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Unable to download the proposal."),
        );
      }

      const url = window.URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposal-${rfpId}.pdf`;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Unable to download the proposal.",
      );
    }
  }

  return (
    <>
      {downloadError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {downloadError}
        </p>
      )}
      {successToast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg bg-green-700 px-5 py-3 text-sm font-medium text-white shadow-lg"
        >
          {successToast}
        </div>
      )}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="rfp-organization-search" className="sr-only">
              Search by organization
            </label>
            <Input
              id="rfp-organization-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search organizations..."
              className="h-10 pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value === "ALL") {
                setStatusFilter("ALL");
              } else if (isRfpStatus(value)) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger
              aria-label="Filter by status"
              className="h-11 min-h-11 w-full sm:w-48"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {RFP_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredRfps.map((rfp) => (
            <motion.article
              key={rfp.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-slate-900">
                    {rfp.organization}
                  </h3>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {rfp.contactEmail}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={statusBadgeClasses[rfp.status]}
                >
                  {statusLabels[rfp.status]}
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    Contact
                  </dt>
                  <dd className="mt-1 text-slate-800">{rfp.contactName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Sector</dt>
                  <dd className="mt-1 text-slate-800">
                    {sectorLabels[rfp.sector] ?? rfp.sector}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-slate-500">
                    Date received
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {formatDate(rfp.createdAt, locale)}
                  </dd>
                </div>
              </dl>
              <div className="mt-2 flex justify-end">
                <RfpActions
                  rfp={rfp}
                  onView={() => setDetailsRfp(rfp)}
                  onUpdateStatus={() => openStatusDialog(rfp)}
                  onDownload={() => downloadProposal(rfp.id)}
                />
              </div>
            </motion.article>
          ))}
          {filteredRfps.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No RFP requests match these filters.
            </p>
          )}
        </div>

        <div className="hidden overflow-x-auto scrollbar-subtle md:block">
          <div className="min-w-[760px]">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-slate-50 hover:bg-slate-50"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {String(header.column.columnDef.header ?? header.id)}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => {
                  const rfp = row.original;
                  return (
                    <TableRow key={rfp.id} className="hover:bg-slate-50">
                      <TableCell className="px-4 py-4 font-medium text-slate-900">
                        {rfp.organization}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <p className="font-medium text-slate-800">
                          {rfp.contactName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {rfp.contactEmail}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-slate-600">
                        {sectorLabels[rfp.sector] ?? rfp.sector}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-slate-600">
                        {formatDate(rfp.createdAt, locale)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={statusBadgeClasses[rfp.status]}
                        >
                          {statusLabels[rfp.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <RfpActions
                          rfp={rfp}
                          onView={() => setDetailsRfp(rfp)}
                          onUpdateStatus={() => openStatusDialog(rfp)}
                          onDownload={() => downloadProposal(rfp.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-sm text-slate-500"
                    >
                      No RFP requests match these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <Dialog
        open={detailsRfp !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsRfp(null);
          }
        }}
      >
        {detailsRfp && (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>RFP details</DialogTitle>
              <DialogDescription>
                Submitted by {detailsRfp.organization}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-4 py-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500">Contact</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {detailsRfp.contactName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Email</dt>
                <dd className="mt-1 break-all text-sm text-slate-900">
                  {detailsRfp.contactEmail}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Phone</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {detailsRfp.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Sector</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {sectorLabels[detailsRfp.sector] ?? detailsRfp.sector}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Budget</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {detailsRfp.budgetRange || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Timeline</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {detailsRfp.timeline || "Not provided"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500">
                  Project details
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                  {detailsRfp.projectDetails}
                </dd>
              </div>
            </dl>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={statusRfp !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setStatusRfp(null);
            setUpdateError(null);
          }
        }}
      >
        {statusRfp && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update RFP status</DialogTitle>
              <DialogDescription>
                Change the review status for {statusRfp.organization}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleStatusUpdate} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="rfp-status-select"
                  className="text-sm font-medium text-slate-800"
                >
                  Status
                </label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => {
                    if (isRfpStatus(value)) {
                      setNewStatus(value);
                    }
                  }}
                >
                  <SelectTrigger
                    id="rfp-status-select"
                    aria-label="New RFP status"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RFP_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {updateError && (
                <p role="alert" className="text-sm text-red-700">
                  {updateError}
                </p>
              )}

              <DialogFooter className="sm:-mx-4 sm:-mb-4 sm:rounded-b-xl">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
