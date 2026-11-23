import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Code2,
  GraduationCap,
  Headset,
  RadioTower,
  Sun,
  Zap,
} from "lucide-react";
import { RevealSection } from "@/components/MotionReveal";

type ExpertisePageProps = {
  params: Promise<{ locale: string }>;
};

const sectors = [
  { key: "education", Icon: GraduationCap },
  { key: "itSupport", Icon: Headset },
  { key: "software", Icon: Code2 },
  { key: "telecom", Icon: RadioTower },
  { key: "solar", Icon: Sun },
  { key: "power", Icon: Zap },
] as const;

export default async function ExpertisePage({ params }: ExpertisePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Expertise" });

  return (
    <div className="bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="bg-slate-950 px-6 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            {t("eyebrow")}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t("description")}
          </p>
        </div>
      </section>

      <div className="bg-white dark:bg-slate-950">
        {sectors.map(({ key, Icon }, index) => (
          <RevealSection
            key={key}
            className={`relative isolate overflow-hidden border-b border-slate-200 last:border-0 ${
              index % 2 === 1
                ? "bg-slate-50/80 dark:bg-slate-900/70"
                : "bg-white dark:bg-slate-950"
            }`}
          >
            <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl items-center gap-10 px-6 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 select-none text-[clamp(10rem,28vw,26rem)] font-bold leading-none tracking-[-0.08em] text-slate-950/[0.035] dark:text-white/[0.04] ${
                  index % 2 === 1 ? "right-0" : "left-0"
                }`}
              >
                0{index + 1}
              </span>
              <div
                className={`relative z-10 max-w-xl ${
                  index % 2 === 1 ? "lg:order-2" : ""
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  {t("sectorLabel", { number: index + 1 })}
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                  {t(`sectors.${key}.title`)}
                </h2>
                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
                  {t(`sectors.${key}.description`)}
                </p>
              </div>
              <div
                className={`group relative flex min-h-[22rem] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-10 shadow-[0_28px_90px_rgba(2,6,23,0.18)] sm:min-h-[28rem] ${
                  index % 2 === 1 ? "lg:order-1" : ""
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(11,74,139,0.36),transparent_62%)]" />
                <div className="absolute -right-20 -top-20 size-64 rounded-full border border-cyan-100/10 transition duration-700 group-hover:scale-110" />
                <div className="absolute -bottom-28 -left-20 size-80 rounded-full border border-blue-100/10 transition duration-700 group-hover:scale-110" />
                <div className="relative flex size-36 items-center justify-center rounded-[2rem] border border-blue-100/20 bg-white/[0.06] text-cyan-200 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur-xl transition duration-500 group-hover:scale-105 sm:size-44">
                  <Icon
                    size={60}
                    strokeWidth={1.25}
                    aria-hidden="true"
                    className="sm:size-[72px]"
                  />
                </div>
                <div className="absolute bottom-6 left-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:bottom-8 sm:left-8">
                  PrimeHorizon <span className="px-2 text-cyan-300/70">/</span>{" "}
                  0{index + 1}
                </div>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </div>
  );
}
