import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM mru_entries ORDER BY date DESC, id DESC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, truck_no, driver_phone, driver_name, balance_stock, qty, tank_balance, delivered_fuel } = body;

    if (!date || !truck_no || !driver_phone || !driver_name || balance_stock == null || qty == null || tank_balance == null || delivered_fuel == null) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (Number(qty) <= 0) {
      return NextResponse.json({ error: 'Quantity must be > 0' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.execute({
      sql: `INSERT INTO mru_entries (date, truck_no, driver_phone, driver_name, balance_stock, qty, tank_balance, delivered_fuel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [date, truck_no.trim(), driver_phone.trim(), driver_name.trim(),
             Number(balance_stock), Number(qty), Number(tank_balance), Number(delivered_fuel)],
    });

    const row = await db.execute({ sql: 'SELECT * FROM mru_entries WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
