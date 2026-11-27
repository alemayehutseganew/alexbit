import { getTranslations, setRequestLocale } from "next-intl/server";
import { RfpForm } from "./RfpForm";

type RfpPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RfpPage({ params }: RfpPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rfp = await getTranslations({ locale, namespace: "Rfp" });

  return (
    <div className="min-h-full bg-[#f6f8fb] transition-colors dark:bg-slate-950">
      <section className="relative isolate overflow-hidden bg-[#061426] px-6 py-16 text-white sm:px-8 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_20%,rgba(11,74,139,0.55),transparent_44%)]" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        <header className="relative mx-auto max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200">
            PrimeHorizon Group Trading PLC
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {rfp("title")}
          </h1>
          <p className="mt-3 text-lg text-blue-100/75">
            {rfp("titleAm")}
          </p>
        </header>
      </section>
      <section className="relative mx-auto -mt-8 max-w-4xl px-6 pb-16 sm:px-8">
        <RfpForm />
      </section>
    </div>
  );
}
