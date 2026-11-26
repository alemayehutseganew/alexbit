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
    <section className="min-h-full bg-slate-50 px-6 py-12 transition-colors dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-brand-600 md:text-3xl">
            {rfp("title")}
          </h1>
          <p className="mt-2 text-lg text-slate-700 dark:text-slate-300">
            {rfp("titleAm")}
          </p>
        </header>
        <RfpForm />
      </div>
    </section>
  );
}
