import 'dotenv/config'; // This loads environment variables from .env file
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema',
  out: './src/database/migrations',
  dialect: 'postgresql', // instead of 'driver: 'pg''
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
