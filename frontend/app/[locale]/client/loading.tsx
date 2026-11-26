import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading client projects"
      aria-busy="true"
      className="space-y-8"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <section>
        <Skeleton className="mb-5 h-6 w-48" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton
              key={item}
              className="h-48 rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
