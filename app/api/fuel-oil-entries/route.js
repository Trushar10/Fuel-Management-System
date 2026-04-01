import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM fuel_oil_entries ORDER BY date DESC, id DESC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, truck_no, driver_name, fuel_qty, fuel_rate, cost, note } = await request.json();

    if (!date || !truck_no || !driver_name || fuel_qty == null || fuel_rate == null || cost == null) {
      return NextResponse.json({ error: 'All fields except note are required' }, { status: 400 });
    }
    if (Number(fuel_qty) <= 0) {
      return NextResponse.json({ error: 'Fuel quantity must be > 0' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO fuel_oil_entries (date, truck_no, driver_name, fuel_qty, fuel_rate, cost, note)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [date, truck_no.trim(), driver_name.trim(), Number(fuel_qty), Number(fuel_rate),
             Number(cost), (note || '').trim()],
    });

    const row = await db.execute({ sql: 'SELECT * FROM fuel_oil_entries WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
