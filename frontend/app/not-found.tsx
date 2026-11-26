import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Page not found
        </h1>
        <Link
          href="/en"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
