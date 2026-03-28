import { createClient } from '@libsql/client';

// Singleton connection — reused across API calls in the same process
let client;

function getClient() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return client;
}

// Initialize schema on first use
let initialized = false;

export async function getDb() {
  const db = getClient();

  if (!initialized) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fuel_entries (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        date      TEXT    NOT NULL,
        truck_no  TEXT    NOT NULL,
        driver_phone TEXT NOT NULL,
        driver_name  TEXT NOT NULL,
        start_km  REAL   NOT NULL,
        fuel_qty  REAL   NOT NULL,
        end_km    REAL   NOT NULL,
        filling_place TEXT NOT NULL,
        created_at TEXT  DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      )
    `);
    initialized = true;
  }

  return db;
}

// Helper: row to plain object with computed fields
export function withComputed(row) {
  const distance = row.end_km - row.start_km;
  const mileage = row.fuel_qty > 0 ? Math.round((distance / row.fuel_qty) * 100) / 100 : 0;
  return { ...row, distance, mileage };
}
