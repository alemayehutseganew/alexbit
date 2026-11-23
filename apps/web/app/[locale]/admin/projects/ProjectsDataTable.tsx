"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useMemo, useState } from "react";
import type { AdminProjectRecord } from "./types";

const columns: LegacyColumnDef<AdminProjectRecord>[] = [
  { accessorKey: "title", header: "Project Title" },
  { id: "client", header: "Client Organization" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "startDate", header: "Start Date" },
  { id: "actions", header: "Actions" },
];

const statusBadgeClasses: Record<string, string> = {
  PLANNING: "border-blue-200 bg-blue-100 text-blue-800",
  IN_PROGRESS: "border-amber-200 bg-amber-100 text-amber-800",
  COMPLETED: "border-green-200 bg-green-100 text-green-800",
  ON_HOLD: "border-violet-200 bg-violet-100 text-violet-800",
  CANCELLED: "border-red-200 bg-red-100 text-red-800",
};

type ProjectsDataTableProps = {
  projects: AdminProjectRecord[];
  locale: string;
};

function formatDate(value: string | null, locale: string): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date);
}

export function ProjectsDataTable({
  projects,
  locale,
}: ProjectsDataTableProps) {
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] =
    useState<AdminProjectRecord | null>(null);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return projects.filter(
      (project) =>
        project.title.toLowerCase().includes(normalizedSearch) ||
        project.tenant.name.toLowerCase().includes(normalizedSearch),
    );
  }, [projects, search]);

  const table = useLegacyTable({
    data: filteredProjects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="project-search" className="sr-only">
              Search projects or clients
            </label>
            <Input
              id="project-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or clients..."
              className="h-10 pl-9"
            />
          </div>
        </div>

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
              const project = row.original;
              return (
                <TableRow key={project.id} className="hover:bg-slate-50">
                  <TableCell className="px-4 py-4">
                    <p className="font-medium text-slate-900">
                      {project.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {project.description}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <p className="font-medium text-slate-800">
                      {project.tenant.name || project.tenant.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {project.tenant.id}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge
                      variant="outline"
                      className={
                        statusBadgeClasses[project.status] ??
                        "border-slate-200 bg-slate-100 text-slate-700"
                      }
                    >
                      {project.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-slate-600">
                    {formatDate(project.startDate, locale)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${project.title}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <MoreHorizontal
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => setSelectedProject(project)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled
                          title="Project editing is not available yet"
                        >
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProjects.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-slate-500"
                >
                  {projects.length === 0
                    ? "No active projects. Accept an RFP to create a project."
                    : "No projects match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <Dialog
        open={selectedProject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
          }
        }}
      >
        {selectedProject && (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedProject.title}</DialogTitle>
              <DialogDescription>
                Project details and client information.
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-4 py-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500">Client</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {selectedProject.tenant.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Status</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {selectedProject.status.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Start date
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatDate(selectedProject.startDate, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">End date</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatDate(selectedProject.endDate, locale)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                  {selectedProject.description}
                </dd>
              </div>
            </dl>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
