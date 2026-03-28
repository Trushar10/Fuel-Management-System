CREATE TABLE IF NOT EXISTS fuel_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  truck_no TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  start_km REAL NOT NULL,
  fuel_qty REAL NOT NULL,
  end_km REAL NOT NULL,
  filling_place TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_fuel_entries_date ON fuel_entries(date);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_truck_no ON fuel_entries(truck_no);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_driver_name ON fuel_entries(driver_name);
