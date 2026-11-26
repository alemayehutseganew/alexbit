import Link from "next/link";

type FooterProps = {
  locale: string;
  nameEn: string;
  nameAm: string;
  phone: string;
  tagline: string;
  quickLinksTitle: string;
  contactTitle: string;
  legalTitle: string;
  home: string;
  about: string;
  expertise: string;
  investors: string;
  contact: string;
  emailLabel: string;
  privacy: string;
  terms: string;
  email: string;
  year: number;
};

export function Footer({
  locale,
  nameEn,
  nameAm,
  phone,
  tagline,
  quickLinksTitle,
  contactTitle,
  legalTitle,
  home,
  about,
  expertise,
  investors,
  contact,
  emailLabel,
  privacy,
  terms,
  email,
  year,
}: FooterProps) {
  return (
    <footer className="bg-slate-50 px-6 py-14 text-slate-600 transition-colors sm:px-8 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr]">
        <div>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-3 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:text-white"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-xs font-black text-white">
              PH
            </span>
            <span className="text-sm font-bold">{nameEn}</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
            {tagline}
          </p>
          <p className="mt-4 font-ethiopic text-sm leading-7 text-slate-600 dark:text-slate-300">
            {nameAm}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
            {quickLinksTitle}
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { label: home, href: `/${locale}` },
              { label: about, href: `/${locale}/about` },
              { label: expertise, href: `/${locale}/expertise` },
              { label: investors, href: `/${locale}/investors` },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link
                  className="transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:hover:text-white"
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
            {contactTitle}
          </h2>
          <p className="mt-5 text-sm font-medium text-slate-900 dark:text-slate-100">
            {nameEn}
          </p>
          <p className="mt-2 text-sm">
            Phone:{" "}
            <a
              className="hover:text-brand-700 dark:hover:text-white"
              href={`tel:${phone}`}
            >
              {phone}
            </a>
          </p>
          <p className="mt-2 text-sm">
            {emailLabel}:{" "}
            <a
              className="hover:text-brand-700 dark:hover:text-white"
              href={`mailto:${email}`}
            >
              {email}
            </a>
          </p>
          <Link
            href={`/${locale}/contact`}
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-blue-300 dark:hover:text-white"
          >
            {contact}
          </Link>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
            {legalTitle}
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="text-slate-600 dark:text-slate-400">{privacy}</li>
            <li className="text-slate-600 dark:text-slate-400">{terms}</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-slate-500">
        <span>
          © {year} {nameEn}. All rights reserved.
        </span>
        <span className="font-ethiopic">{nameAm}</span>
      </div>
    </footer>
  );
}
