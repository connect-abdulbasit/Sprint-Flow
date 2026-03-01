import 'dotenv/config';
import type { Config } from 'drizzle-kit';

// drizzle-kit no longer exports a helper function; we just provide a plain
// configuration object that matches the `Config` type.  additional fields
// (dialect/dbCredentials) are allowed at runtime by the CLI, so we cast to
// `any` to satisfy TypeScript.

const config: Config & any = {
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
};

export default config;
