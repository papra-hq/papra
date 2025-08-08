import { env } from 'node:process';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/modules/**/*.table.ts', './src/modules/**/*.tables.ts'],
  dialect: 'turso',
  out: './src/migrations',
  dbCredentials: {
    url: env.DATABASE_URL ?? 'file:./db.sqlite',
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});
