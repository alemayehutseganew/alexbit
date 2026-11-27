import { getTranslations, setRequestLocale } from "next-intl/server";
import { RfpForm } from "./RfpForm";
import { RevealSection } from "@/components/MotionReveal";

type RfpPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RfpPage({ params }: RfpPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rfp = await getTranslations({ locale, namespace: "Rfp" });

  return (
    <div className="min-h-full bg-slate-50 transition-colors dark:bg-slate-950">
      <RevealSection className="relative isolate overflow-hidden bg-slate-50 px-6 py-16 text-slate-900 sm:px-8 sm:py-20 dark:bg-[#061426] dark:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_20%,rgba(11,74,139,0.12),transparent_44%)] dark:bg-[radial-gradient(ellipse_at_78%_20%,rgba(11,74,139,0.55),transparent_44%)]" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(11,74,139,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(11,74,139,.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        <header className="relative mx-auto max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-blue-200">
            PrimeHorizon Group Trading PLC
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl dark:text-white">
            {rfp("title")}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-blue-100/75">
            {rfp("titleAm")}
          </p>
        </header>
      </RevealSection>
      <RevealSection className="relative mx-auto -mt-8 max-w-4xl px-6 pb-16 sm:px-8">
        <RfpForm />
      </RevealSection>
    </div>
  );
}
