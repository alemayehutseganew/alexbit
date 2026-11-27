import type { Metadata } from "next";
import { Inter, Noto_Sans_Ethiopic } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { PublicSiteShell } from "@/components/PublicSiteShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-noto-sans-ethiopic",
  display: "swap",
});

const locales = ["en", "am"] as const;
const siteTitle = "PrimeHorizon Group Trading PLC | Enterprise Tech Ethiopia";
const siteDescription =
  "A 20+ expert syndicate bridging local infrastructure experience (EEP, CBE, Ethio Telecom, INSA) and global education to deliver enterprise technology solutions.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/images/og-image.jpg"],
  },
};

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const [messages, brand, nav, footer] = await Promise.all([
    getMessages(),
    getTranslations({ locale, namespace: "Brand" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Footer" }),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <div
        className={`${inter.variable} ${notoSansEthiopic.variable} font-[family-name:var(--font-inter)]`}
        lang={locale}
      >
        <PublicSiteShell
          locale={locale}
          nav={{
            home: nav("home"),
            about: nav("about"),
            expertise: nav("expertise"),
            investors: nav("investors"),
            contact: nav("contact"),
            clientPortal: nav("clientPortal"),
            shareholderPortal: nav("shareholderPortal"),
            menu: nav("menu"),
            close: nav("close"),
            language: nav("language"),
            english: nav("english"),
            amharic: nav("amharic"),
            darkMode: nav("darkMode"),
            lightMode: nav("lightMode"),
          }}
          footer={{
            nameEn: brand("nameEn"),
            nameAm: brand("nameAm"),
            phone: brand("phone"),
            tagline: footer("tagline"),
            quickLinksTitle: footer("quickLinksTitle"),
            contactTitle: footer("contactTitle"),
            portalsTitle: footer("portalsTitle"),
            phoneLabel: footer("phoneLabel"),
            requestProposal: footer("requestProposal"),
            allRightsReserved: footer("allRightsReserved"),
            emailLabel: footer("emailLabel"),
            email: footer("email"),
            year: new Date().getFullYear(),
          }}
        >
          {children}
        </PublicSiteShell>
      </div>
    </NextIntlClientProvider>
  );
}
