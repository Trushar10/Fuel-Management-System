import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM fuel_rates ORDER BY date DESC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, rate, fuel_type } = await request.json();
    if (!date || rate == null) return NextResponse.json({ error: 'Date and rate are required' }, { status: 400 });
    if (Number(rate) <= 0) return NextResponse.json({ error: 'Rate must be > 0' }, { status: 400 });

    const type = (fuel_type || 'Diesel').trim();
    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM fuel_rates WHERE date = ? AND fuel_type = ?', args: [date, type] });
    if (existing.rows.length > 0) return NextResponse.json({ error: 'Rate for this date and fuel type already exists' }, { status: 409 });

    const result = await db.execute({ sql: 'INSERT INTO fuel_rates (date, rate, fuel_type) VALUES (?, ?, ?)', args: [date, Number(rate), type] });
    const row = await db.execute({ sql: 'SELECT * FROM fuel_rates WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM fuel_rates');
    return NextResponse.json({ message: 'All deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
