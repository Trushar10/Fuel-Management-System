import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM products ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Product name is required' }, { status: 400 });

    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM products WHERE name = ?', args: [name.trim()] });
    if (existing.rows.length > 0) return NextResponse.json({ error: 'This product already exists' }, { status: 409 });

    const result = await db.execute({ sql: 'INSERT INTO products (name) VALUES (?)', args: [name.trim()] });
    const row = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM products');
    return NextResponse.json({ message: 'All deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM products');
    return NextResponse.json({ message: 'All deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
