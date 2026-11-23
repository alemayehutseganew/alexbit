import Link from "next/link";

type HeaderProps = {
  locale: string;
  variant?: "light" | "dark";
  nameEn: string;
  nameAm: string;
  clientPortalLabel: string;
  shareholderPortalLabel: string;
};

export function Header({
  locale,
  variant = "light",
  nameEn,
  nameAm,
  clientPortalLabel,
  shareholderPortalLabel,
}: HeaderProps) {
  const isDark = variant === "dark";

  return (
    <header
      className={`border-b ${
        isDark ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={`text-lg font-bold ${
              isDark ? "text-white" : "text-brand-600"
            }`}
          >
            {nameEn}
          </p>
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {nameAm}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-3" aria-label="Portals">
          <Link
            href={`/${locale}/client`}
            className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
              isDark
                ? "border-white/30 text-white hover:bg-white/10"
                : "border-brand-600 text-brand-600 hover:bg-blue-50"
            }`}
          >
            {clientPortalLabel}
          </Link>
          <Link
            href={`/${locale}/login?role=shareholder`}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            {shareholderPortalLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
