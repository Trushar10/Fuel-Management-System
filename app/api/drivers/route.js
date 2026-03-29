import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM drivers ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, phone, company } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM drivers WHERE name = ?', args: [name.trim()] });
    if (existing.rows.length > 0) return NextResponse.json({ error: 'Driver with this name already exists' }, { status: 409 });

    const result = await db.execute({ sql: 'INSERT INTO drivers (name, phone, company) VALUES (?, ?, ?)', args: [name.trim(), (phone || '').trim(), (company || '').trim()] });
    const row = await db.execute({ sql: 'SELECT * FROM drivers WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
