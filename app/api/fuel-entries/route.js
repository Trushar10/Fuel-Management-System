import { NextResponse } from 'next/server';
import { getDb, withComputed } from '@/lib/db';

// GET /api/fuel-entries
export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const truck_no = searchParams.get('truck_no');
    const driver_name = searchParams.get('driver_name');
    const from_date = searchParams.get('from_date');
    const to_date = searchParams.get('to_date');

    let sql = 'SELECT * FROM fuel_entries WHERE 1=1';
    const args = [];

    if (truck_no) { sql += ' AND truck_no = ?'; args.push(truck_no); }
    if (driver_name) { sql += ' AND driver_name LIKE ?'; args.push(`%${driver_name}%`); }
    if (from_date) { sql += ' AND date >= ?'; args.push(from_date); }
    if (to_date) { sql += ' AND date <= ?'; args.push(to_date); }

    sql += ' ORDER BY date DESC, id DESC';

    const result = await db.execute({ sql, args });
    const rows = result.rows.map(withComputed);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/fuel-entries
export async function POST(request) {
  try {
    const body = await request.json();
    const { date, truck_no, driver_phone, driver_name, start_km, fuel_qty, end_km, filling_place, fuel_rate } = body;

    if (!date || !truck_no || !driver_phone || !driver_name || start_km == null || fuel_qty == null || end_km == null || !filling_place) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (Number(end_km) < Number(start_km)) {
      return NextResponse.json({ error: 'End KM must be >= Start KM' }, { status: 400 });
    }
    if (Number(fuel_qty) <= 0) {
      return NextResponse.json({ error: 'Fuel quantity must be > 0' }, { status: 400 });
    }

    const db = await getDb();
    const fRate = Number(fuel_rate) || 0;
    const totalCost = fRate > 0 ? Number(fuel_qty) * fRate : 0;
    const result = await db.execute({
      sql: `INSERT INTO fuel_entries (date, truck_no, driver_phone, driver_name, start_km, fuel_qty, end_km, filling_place, fuel_rate, total_fuel_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [date, truck_no.trim(), driver_phone.trim(), driver_name.trim(),
             Number(start_km), Number(fuel_qty), Number(end_km), filling_place.trim(), fRate, Math.round(totalCost * 100) / 100],
    });

    const row = await db.execute({ sql: 'SELECT * FROM fuel_entries WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(withComputed(row.rows[0]), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
