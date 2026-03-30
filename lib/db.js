import { createClient } from '@libsql/client';

// Singleton connection — reused across API calls in the same process
let client;

function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not configured. Add it in Vercel Project Settings > Environment Variables, then redeploy.');
  }

  if (url.startsWith('libsql://') && !authToken) {
    throw new Error('TURSO_AUTH_TOKEN is not configured. Add it in Vercel Project Settings > Environment Variables, then redeploy.');
  }

  if (!client) {
    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

// Initialize schema on first use
let initialized = false;

export async function getDb() {
  const db = getClient();

  if (!initialized) {
    await db.executeMultiple(`
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
      );
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        brand TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS filling_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS fuel_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        rate REAL NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS fuel_cost_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        truck_no TEXT NOT NULL,
        driver_name TEXT NOT NULL,
        fuel_qty REAL NOT NULL,
        fuel_rate REAL NOT NULL,
        cost REAL NOT NULL,
        filling_place TEXT NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
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
