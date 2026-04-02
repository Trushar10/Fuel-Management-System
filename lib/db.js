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
        vehicle_no  TEXT    NOT NULL,
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
        fuel_type TEXT NOT NULL DEFAULT 'Diesel',
        company TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS filling_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        is_mru INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS fuel_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        rate REAL NOT NULL,
        fuel_type TEXT NOT NULL DEFAULT 'Diesel',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS fuel_cost_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        vehicle_no TEXT NOT NULL,
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
        location TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS residual_fuel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        opening_balance REAL NOT NULL,
        filling_place TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS mru_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        mru_name TEXT NOT NULL DEFAULT '',
        vehicle_no TEXT NOT NULL,
        driver_phone TEXT NOT NULL,
        driver_name TEXT NOT NULL,
        balance_stock REAL NOT NULL,
        qty REAL NOT NULL,
        tank_balance REAL NOT NULL,
        delivered_fuel REAL NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS rented_vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL UNIQUE,
        company TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        vehicle_number TEXT NOT NULL DEFAULT '',
        fuel_type TEXT NOT NULL DEFAULT 'Diesel',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS fuel_oil_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        vehicle_no TEXT NOT NULL,
        driver_name TEXT NOT NULL,
        fuel_qty REAL NOT NULL,
        fuel_rate REAL NOT NULL,
        cost REAL NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
    `);

    // Migrations: add columns that may not exist on older databases
    try { await db.execute('ALTER TABLE companies ADD COLUMN location TEXT NOT NULL DEFAULT \'\''); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE residual_fuel ADD COLUMN filling_place TEXT NOT NULL DEFAULT \'\''); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE filling_places ADD COLUMN is_mru INTEGER NOT NULL DEFAULT 0'); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE filling_places ADD COLUMN associate_vehicle TEXT NOT NULL DEFAULT \'\''); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE mru_entries ADD COLUMN mru_name TEXT NOT NULL DEFAULT \'\''); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE fuel_entries ADD COLUMN fuel_rate REAL NOT NULL DEFAULT 0'); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE fuel_entries ADD COLUMN total_fuel_cost REAL NOT NULL DEFAULT 0'); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE fuel_rates ADD COLUMN fuel_type TEXT NOT NULL DEFAULT \'Diesel\''); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE vehicles ADD COLUMN fuel_type TEXT NOT NULL DEFAULT \'Diesel\''); } catch (_) { /* already exists */ }
    try { await db.execute('ALTER TABLE rented_vehicles ADD COLUMN fuel_type TEXT NOT NULL DEFAULT \'Diesel\''); } catch (_) { /* already exists */ }

    // Migrate vehicles.brand → fuel_type: copy brand data into fuel_type, then drop brand via table rebuild
    try {
      const vInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='vehicles'");
      if (vInfo.rows.length > 0 && String(vInfo.rows[0].sql).includes('brand')) {
        await db.execute("UPDATE vehicles SET fuel_type = 'Diesel' WHERE fuel_type IS NULL OR fuel_type = ''");
        await db.execute('CREATE TABLE IF NOT EXISTS vehicles_new (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL, fuel_type TEXT NOT NULL DEFAULT \'Diesel\', company TEXT NOT NULL DEFAULT \'\', created_at TEXT DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%SZ\',\'now\')))'); 
        await db.execute('INSERT OR IGNORE INTO vehicles_new (id, number, fuel_type, company, created_at) SELECT id, number, fuel_type, company, created_at FROM vehicles');
        await db.execute('DROP TABLE vehicles');
        await db.execute('ALTER TABLE vehicles_new RENAME TO vehicles');
      }
    } catch (_) { /* ignore */ }

    // Rename truck_no → vehicle_no in existing tables
    try { await db.execute('ALTER TABLE fuel_entries RENAME COLUMN truck_no TO vehicle_no'); } catch (_) { /* already renamed */ }
    try { await db.execute('ALTER TABLE fuel_cost_entries RENAME COLUMN truck_no TO vehicle_no'); } catch (_) { /* already renamed */ }
    try { await db.execute('ALTER TABLE fuel_oil_entries RENAME COLUMN truck_no TO vehicle_no'); } catch (_) { /* already renamed */ }
    try { await db.execute('ALTER TABLE mru_entries RENAME COLUMN truck_no TO vehicle_no'); } catch (_) { /* already renamed */ }

    // Remove UNIQUE constraint on fuel_rates.date if present (allows multiple fuel types per date)
    try {
      const tblInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='fuel_rates'");
      if (tblInfo.rows.length > 0 && String(tblInfo.rows[0].sql).includes('UNIQUE')) {
        await db.execute('CREATE TABLE IF NOT EXISTS fuel_rates_new (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, rate REAL NOT NULL, fuel_type TEXT NOT NULL DEFAULT \'Diesel\', created_at TEXT DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%SZ\',\'now\')))');
        await db.execute('INSERT OR IGNORE INTO fuel_rates_new (id, date, rate, fuel_type, created_at) SELECT id, date, rate, fuel_type, created_at FROM fuel_rates');
        await db.execute('DROP TABLE fuel_rates');
        await db.execute('ALTER TABLE fuel_rates_new RENAME TO fuel_rates');
      }
    } catch (_) { /* ignore */ }

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
