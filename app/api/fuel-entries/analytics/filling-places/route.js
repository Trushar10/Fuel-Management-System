import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute(`
      SELECT
        filling_place,
        COUNT(*) as count,
        ROUND(SUM(fuel_qty), 2) as total_fuel
      FROM fuel_entries
      GROUP BY filling_place
      ORDER BY count DESC
    `);
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
