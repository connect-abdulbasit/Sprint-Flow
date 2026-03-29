import "dotenv/config";
import type { Config } from "drizzle-kit";

const config: Config & any = {
  out: "./drizzle",
  schema: "./src/db/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};

export default config;
