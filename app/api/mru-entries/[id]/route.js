import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM mru_entries WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, mru_name, truck_no, driver_phone, driver_name, balance_stock, qty, tank_balance, delivered_fuel } = body;

    if (!date || !truck_no || !driver_phone || !driver_name || balance_stock == null || qty == null || tank_balance == null || delivered_fuel == null) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = await getDb();
    await db.execute({
      sql: `UPDATE mru_entries SET date=?, mru_name=?, truck_no=?, driver_phone=?, driver_name=?, balance_stock=?, qty=?, tank_balance=?, delivered_fuel=? WHERE id=?`,
      args: [date, (mru_name || '').trim(), truck_no.trim(), driver_phone.trim(), driver_name.trim(),
             Number(balance_stock), Number(qty), Number(tank_balance), Number(delivered_fuel), id],
    });

    const row = await db.execute({ sql: 'SELECT * FROM mru_entries WHERE id = ?', args: [id] });
    return NextResponse.json(row.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM mru_entries WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
