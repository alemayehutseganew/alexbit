import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import process from "node:process";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: ["@base-ui/react", "@repo/ui"],
};

export default withNextIntl(nextConfig);
