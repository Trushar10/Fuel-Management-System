import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute(`
      SELECT
        driver_name,
        COUNT(*) as entries,
        ROUND(SUM(fuel_qty), 2) as total_fuel,
        ROUND(SUM(end_km - start_km), 2) as total_distance,
        ROUND(AVG(CASE WHEN fuel_qty > 0 THEN (end_km - start_km) / fuel_qty ELSE 0 END), 2) as avg_mileage,
        ROUND(MIN(CASE WHEN fuel_qty > 0 THEN (end_km - start_km) / fuel_qty ELSE 0 END), 2) as min_mileage,
        ROUND(MAX(CASE WHEN fuel_qty > 0 THEN (end_km - start_km) / fuel_qty ELSE 0 END), 2) as max_mileage
      FROM fuel_entries
      GROUP BY driver_name
      ORDER BY avg_mileage DESC
    `);
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
