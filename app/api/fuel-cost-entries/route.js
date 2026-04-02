import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const truck_no = searchParams.get('truck_no');
    const driver_name = searchParams.get('driver_name');
    const from_date = searchParams.get('from_date');
    const to_date = searchParams.get('to_date');

    let sql = 'SELECT * FROM fuel_cost_entries WHERE 1=1';
    const args = [];

    if (truck_no) { sql += ' AND truck_no = ?'; args.push(truck_no); }
    if (driver_name) { sql += ' AND driver_name LIKE ?'; args.push(`%${driver_name}%`); }
    if (from_date) { sql += ' AND date >= ?'; args.push(from_date); }
    if (to_date) { sql += ' AND date <= ?'; args.push(to_date); }

    sql += ' ORDER BY date DESC, id DESC';

    const result = await db.execute({ sql, args });
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, truck_no, driver_name, fuel_qty, fuel_rate, filling_place } = body;

    if (!date || !truck_no || !driver_name || fuel_qty == null || fuel_rate == null || !filling_place) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (Number(fuel_qty) <= 0) return NextResponse.json({ error: 'Fuel quantity must be > 0' }, { status: 400 });
    if (Number(fuel_rate) <= 0) return NextResponse.json({ error: 'Fuel rate must be > 0' }, { status: 400 });

    const cost = Math.round(Number(fuel_qty) * Number(fuel_rate) * 100) / 100;

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO fuel_cost_entries (date, truck_no, driver_name, fuel_qty, fuel_rate, cost, filling_place)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [date, truck_no.trim(), driver_name.trim(), Number(fuel_qty), Number(fuel_rate), cost, filling_place.trim()],
    });

    const row = await db.execute({ sql: 'SELECT * FROM fuel_cost_entries WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM fuel_cost_entries');
    return NextResponse.json({ message: 'All entries deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
