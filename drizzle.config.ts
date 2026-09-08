import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'virashops',
    password: process.env.DB_PASSWORD ?? 'virashops',
    database: process.env.DB_NAME ?? 'virashops',
    ssl: false,
  },
});
