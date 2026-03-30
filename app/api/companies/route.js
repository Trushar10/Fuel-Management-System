import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM companies ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, location } = await request.json();
    if (!name) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    if (!location) return NextResponse.json({ error: 'Location is required' }, { status: 400 });

    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM companies WHERE name = ?', args: [name.trim()] });
    if (existing.rows.length > 0) return NextResponse.json({ error: 'This company already exists' }, { status: 409 });

    const result = await db.execute({ sql: 'INSERT INTO companies (name, location) VALUES (?, ?)', args: [name.trim(), (location || '').trim()] });
    const row = await db.execute({ sql: 'SELECT * FROM companies WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
