import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type FooterProps = {
  locale: string;
  nameEn: string;
  nameAm: string;
  phone: string;
  tagline: string;
  quickLinksTitle: string;
  contactTitle: string;
  portalsTitle: string;
  legalTitle: string;
  home: string;
  about: string;
  expertise: string;
  investors: string;
  contact: string;
  requestProposal: string;
  clientPortal: string;
  shareholderPortal: string;
  phoneLabel: string;
  emailLabel: string;
  allRightsReserved: string;
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
  portalsTitle,
  legalTitle,
  home,
  about,
  expertise,
  investors,
  contact,
  requestProposal,
  clientPortal,
  shareholderPortal,
  phoneLabel,
  emailLabel,
  allRightsReserved,
  email,
  year,
}: FooterProps) {
  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-[#061426] px-6 py-14 text-slate-300 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-48 -z-10 size-[30rem] rounded-full bg-brand-600/20 blur-[120px]"
      />
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_1.2fr_1fr]">
        <div className="max-w-sm">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-4 focus-visible:ring-offset-[#061426]"
          >
            <BrandLogo
              alt=""
              className="size-14 rounded-xl bg-white object-contain p-0.5 shadow-lg shadow-black/20"
            />
            <span className="text-sm font-bold leading-5 tracking-tight">
              PrimeHorizon
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-blue-100/65">
                Group Trading PLC
              </span>
            </span>
          </Link>
          <p className="mt-5 text-sm leading-6 text-slate-300/75">
            {tagline}
          </p>
          <p className="mt-4 font-ethiopic text-sm leading-7 text-slate-200/85">
            {nameAm}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {quickLinksTitle}
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { label: home, href: `/${locale}` },
              { label: about, href: `/${locale}/about` },
              { label: expertise, href: `/${locale}/expertise` },
              { label: investors, href: `/${locale}/investors` },
              { label: contact, href: `/${locale}/contact` },
              { label: requestProposal, href: `/${locale}/rfp` },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link
                  className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {contactTitle}
          </h2>
          <div className="mt-5 space-y-4">
            <a
              className="inline-flex items-center gap-3 rounded-md text-sm transition hover:text-white hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
              href={`tel:${phone}`}
            >
              <Phone className="size-4 text-cyan-300" aria-hidden="true" />
              <span>
                <span className="block text-xs text-slate-400">{phoneLabel}</span>
                <span className="mt-0.5 block font-medium text-slate-100">
                  {phone}
                </span>
              </span>
            </a>
            <a
              className="inline-flex items-center gap-3 rounded-md text-sm transition hover:text-white hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061426]"
              href={`mailto:${email}`}
            >
              <Mail className="size-4 text-cyan-300" aria-hidden="true" />
              <span>
                <span className="block text-xs text-slate-400">{emailLabel}</span>
                <span className="mt-0.5 block font-medium text-slate-100">
                  {email}
                </span>
              </span>
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {legalTitle}
          </h2>
          <p className="mt-5 text-sm leading-6 text-slate-300/75">
            {nameEn}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            © {year} {allRightsReserved}
          </p>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {portalsTitle}
          </h3>
          <div className="mt-3 grid gap-3">
            {[
              { label: clientPortal, href: `/${locale}/client` },
              {
                label: shareholderPortal,
                href: `/${locale}/login?role=shareholder`,
              },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="group inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                {label}
                <ArrowUpRight
                  className="size-4 shrink-0 text-cyan-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-center sm:text-left">
          © {year} {nameEn}. {allRightsReserved}
        </span>
        <span className="font-ethiopic text-center sm:text-right">{nameAm}</span>
      </div>
    </footer>
  );
}
