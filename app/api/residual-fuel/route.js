import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM residual_fuel ORDER BY date DESC, id DESC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, opening_balance, filling_place, note } = await request.json();
    if (!date || opening_balance == null) return NextResponse.json({ error: 'Date and opening balance are required' }, { status: 400 });

    const db = await getDb();
    const result = await db.execute({
      sql: 'INSERT INTO residual_fuel (date, opening_balance, filling_place, note) VALUES (?, ?, ?, ?)',
      args: [date, Number(opening_balance), (filling_place || '').trim(), (note || '').trim()],
    });
    const row = await db.execute({ sql: 'SELECT * FROM residual_fuel WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
