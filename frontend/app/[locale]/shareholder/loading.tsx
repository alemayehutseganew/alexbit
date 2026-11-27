import { Skeleton } from "@/components/ui/skeleton";

export default function ShareholderLoading() {
  return (
    <div
      role="status"
      aria-label="Loading shareholder portal"
      aria-busy="true"
      className="space-y-6"
    >
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <span className="sr-only">Loading shareholder data</span>
    </div>
  );
}
