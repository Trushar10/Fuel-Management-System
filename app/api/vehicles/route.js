import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM vehicles ORDER BY number ASC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { number, brand, company } = await request.json();
    if (!number) return NextResponse.json({ error: 'Vehicle number is required' }, { status: 400 });

    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM vehicles WHERE number = ?', args: [number.trim()] });
    if (existing.rows.length > 0) return NextResponse.json({ error: 'Vehicle with this number already exists' }, { status: 409 });

    const result = await db.execute({ sql: 'INSERT INTO vehicles (number, brand, company) VALUES (?, ?, ?)', args: [number.trim(), (brand || '').trim(), (company || '').trim()] });
    const row = await db.execute({ sql: 'SELECT * FROM vehicles WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
