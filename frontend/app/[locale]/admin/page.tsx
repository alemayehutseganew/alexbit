import {
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  Timer,
} from "lucide-react";

const metrics = [
  {
    label: "Total RFPs",
    value: "128",
    detail: "+12% from last month",
    icon: FileText,
    iconClass: "bg-blue-50 text-brand-600",
  },
  {
    label: "Pending Review",
    value: "24",
    detail: "8 received this week",
    icon: Timer,
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    label: "Active Projects",
    value: "12",
    detail: "Across 6 client organizations",
    icon: BriefcaseBusiness,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Revenue",
    value: "$2.4M",
    detail: "+8.2% from last quarter",
    icon: CircleDollarSign,
    iconClass: "bg-violet-50 text-violet-600",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your organization&apos;s activity and performance.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    {metric.value}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${metric.iconClass}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-xs text-slate-500">{metric.detail}</p>
            </article>
          );
        })}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Welcome to your dashboard
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Key operational metrics will appear here as your team processes RFPs
          and manages projects.
        </p>
      </section>
    </div>
  );
}
