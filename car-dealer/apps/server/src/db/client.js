import postgres from 'postgres';
import { DATABASE_URL, NODE_ENV } from '../config.js';

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

export const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Neon and Supabase require SSL. postgres.js reads it from the URL's
  // ?sslmode=require param automatically. ssl: true is a fallback safety net.
  ssl: DATABASE_URL.includes('sslmode=require') || DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
  debug: NODE_ENV === 'development',
});

/** Quick connectivity check used by the /health route. */
export async function checkDbConnection() {
  await sql`SELECT 1`;
}
