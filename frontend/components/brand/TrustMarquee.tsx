"use client";

type TrustMarqueeProps = {
  label: string;
  partners: string[];
};

export function TrustMarquee({ label, partners }: TrustMarqueeProps) {
  return (
    <section
      aria-label={label}
      className="overflow-hidden border-y border-slate-200 bg-slate-50 py-7 transition-colors dark:border-white/10 dark:bg-slate-950/90"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 sm:px-8">
        <p className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:block">
          {label}
        </p>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="trusted-marquee flex w-max items-center gap-8 sm:gap-12"
          >
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-8 sm:gap-12">
                {partners.map((partner) => (
                  <span
                    key={`${copy}-${partner}`}
                    className="whitespace-nowrap text-base font-semibold tracking-tight text-slate-600 sm:text-xl dark:text-slate-300/80"
                  >
                    {partner}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">{partners.join(", ")}</span>
      </div>
    </section>
  );
}
