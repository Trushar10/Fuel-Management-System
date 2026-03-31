import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM residual_fuel WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { date, opening_balance, note } = await request.json();
    if (!date || opening_balance == null) return NextResponse.json({ error: 'Date and opening balance are required' }, { status: 400 });

    const db = await getDb();
    await db.execute({
      sql: 'UPDATE residual_fuel SET date=?, opening_balance=?, note=? WHERE id=?',
      args: [date, Number(opening_balance), (note || '').trim(), id],
    });
    const row = await db.execute({ sql: 'SELECT * FROM residual_fuel WHERE id = ?', args: [id] });
    return NextResponse.json(row.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM residual_fuel WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
