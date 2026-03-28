import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const truck_no = searchParams.get('truck_no');

    let sql = `
      SELECT date, truck_no,
        ROUND(CASE WHEN fuel_qty > 0 THEN (end_km - start_km) / fuel_qty ELSE 0 END, 2) as mileage,
        fuel_qty,
        ROUND(end_km - start_km, 2) as distance
      FROM fuel_entries
    `;
    const args = [];
    if (truck_no) { sql += ' WHERE truck_no = ?'; args.push(truck_no); }
    sql += ' ORDER BY date ASC, id ASC';

    const result = await db.execute({ sql, args });
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
