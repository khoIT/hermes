import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://hermes:dev@localhost:5432/hermes',
  },
  strict: true,
  verbose: true,
} satisfies Config;
