import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { ContactForm } from "./ContactForm";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, brand] = await Promise.all([
    getTranslations({ locale, namespace: "Contact" }),
    getTranslations({ locale, namespace: "Brand" }),
  ]);

  return (
    <div className="bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="relative isolate overflow-hidden bg-[#061426] px-6 py-16 text-white sm:px-8 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_20%,rgba(11,74,139,0.5),transparent_44%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
            <span className="size-1.5 rounded-full bg-[#f2b632]" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-4xl md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/75">
            {t("description")}
          </p>
          <a
            href={`tel:${brand("phone")}`}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-200/60 hover:bg-white/[0.12]"
          >
            <Phone size={16} aria-hidden="true" />
            {brand("phone")}
          </a>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <aside className="order-2 space-y-8 lg:order-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              {t("companyLabel")}
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
              {brand("nameEn")}
            </h2>
            <p className="mt-2 font-ethiopic text-sm leading-7 text-slate-600 dark:text-slate-300">
              {brand("nameAm")}
            </p>
          </div>

          <div className="space-y-4">
            <a
              href={`tel:${brand("phone")}`}
              className="group flex min-h-16 items-center gap-4 rounded-xl border border-slate-200 p-4 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_0_28px_rgba(6,182,212,0.12)] dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-brand-600 transition group-hover:shadow-[0_0_18px_rgba(6,182,212,0.35)]">
                <Phone size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs text-slate-500">
                  {t("phone")}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">
                  {brand("phone")}
                </span>
              </span>
            </a>
            <a
              href="mailto:info@primehorizon.com"
              className="group flex min-h-16 items-center gap-4 rounded-xl border border-slate-200 p-4 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_0_28px_rgba(6,182,212,0.12)] dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-brand-600 transition group-hover:shadow-[0_0_18px_rgba(6,182,212,0.35)]">
                <Mail size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs text-slate-500">
                  {t("email")}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">
                  info@primehorizon.com
                </span>
              </span>
            </a>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              {t("stampTitle")}
            </p>
            <div className="mt-4 flex min-h-36 items-center justify-center rounded-xl border border-blue-100 bg-white/80 px-5 dark:border-white/10 dark:bg-slate-950/60">
              <Image
                src="/stamp.png"
                alt={t("stampTitle")}
                width={325}
                height={320}
                className="h-28 w-28 object-contain"
              />
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("authorizedPartner")}
            </p>
          </div>

          <div className="relative flex min-h-48 items-center overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_25%,transparent_25%),linear-gradient(225deg,#eff6ff_25%,transparent_25%),linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(315deg,#f8fafc_25%,#fff_25%)] bg-[length:36px_36px] p-5 dark:border-white/10 dark:bg-slate-900">
            <div className="absolute inset-0 bg-white/25 dark:bg-slate-950/50" />
            <div className="relative mx-auto flex items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
              <MapPin className="text-brand-600" size={20} aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {t("mapLocation")}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {t("mapCaption")}
                </span>
              </span>
            </div>
          </div>
        </aside>

        <section className="order-1 rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 via-blue-600/10 to-transparent p-px shadow-[0_0_44px_rgba(6,182,212,0.1)] sm:p-px lg:order-2">
          <div className="h-full rounded-[calc(1.5rem-1px)] bg-white p-6 sm:p-9 dark:bg-slate-900/90">
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {t("formTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("formDescription")}
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}
