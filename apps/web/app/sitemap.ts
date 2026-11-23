import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const locales = ["en", "am"] as const;
const publicPages = [
  { path: "", priority: 1 },
  { path: "about", priority: 0.7 },
  { path: "expertise", priority: 0.8 },
  { path: "investors", priority: 0.6 },
  { path: "contact", priority: 0.6 },
  { path: "rfp", priority: 0.6 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return [];
  }

  const baseUrl = new URL(`${siteUrl.replace(/\/+$/, "")}/`);
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS");
  }

  return locales.flatMap((locale) =>
    publicPages.map(({ path, priority }) => ({
      url: new URL(`${locale}${path ? `/${path}` : ""}`, baseUrl).toString(),
      changeFrequency: path ? "monthly" : "weekly",
      priority,
    })),
  );
}
