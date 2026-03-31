/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Parse the connection string using URL (Node.js built‑in)
const url = new URL(connectionString);

// Extract components
const poolConfig = {
  host: url.hostname,
  port: parseInt(url.port || '5432', 10),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1), // Remove leading '/'
  // SSL: accept self‑signed certificates in development only
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true } // strict validation in production
      : { rejectUnauthorized: false }, // bypass for development
};

const pool = new Pool(poolConfig);
export const db = drizzle(pool);
