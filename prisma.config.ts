import { defineConfig } from "prisma/config";
import { loadEnvFile } from "node:process";

// Load environment variables for Prisma CLI
loadEnvFile(".env");
loadEnvFile(".env.local");

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
