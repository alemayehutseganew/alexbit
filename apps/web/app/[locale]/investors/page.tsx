import { setRequestLocale } from "next-intl/server";
import { InvestorContent } from "./InvestorContent";

type InvestorsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function InvestorsPage({ params }: InvestorsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <InvestorContent locale={locale} />;
}
