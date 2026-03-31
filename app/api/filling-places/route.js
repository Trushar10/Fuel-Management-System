import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM filling_places ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, is_mru } = await request.json();
    if (!name) return NextResponse.json({ error: 'Place name is required' }, { status: 400 });

    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM filling_places WHERE name = ?', args: [name.trim()] });
    if (existing.rows.length > 0) return NextResponse.json({ error: 'This filling place already exists' }, { status: 409 });

    const result = await db.execute({ sql: 'INSERT INTO filling_places (name, is_mru) VALUES (?, ?)', args: [name.trim(), is_mru ? 1 : 0] });
    const row = await db.execute({ sql: 'SELECT * FROM filling_places WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
