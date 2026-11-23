import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(configDirectory, ".env") });
config({ path: resolve(configDirectory, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.ts",
  },
});
