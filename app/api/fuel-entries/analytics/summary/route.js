import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute(`
      SELECT
        COUNT(*) as total_entries,
        ROUND(SUM(fuel_qty), 2) as total_fuel,
        ROUND(SUM(end_km - start_km), 2) as total_distance,
        ROUND(AVG(CASE WHEN fuel_qty > 0 THEN (end_km - start_km) / fuel_qty ELSE 0 END), 2) as avg_mileage,
        COUNT(DISTINCT vehicle_no) as total_trucks,
        COUNT(DISTINCT driver_name) as total_drivers
      FROM fuel_entries
    `);
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
