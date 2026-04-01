import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM staff ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, vehicle_number } = await request.json();
    if (!name) return NextResponse.json({ error: 'Staff name is required' }, { status: 400 });

    const db = await getDb();
    const result = await db.execute({
      sql: 'INSERT INTO staff (name, vehicle_number) VALUES (?, ?)',
      args: [name.trim(), (vehicle_number || '').trim()],
    });
    const row = await db.execute({ sql: 'SELECT * FROM staff WHERE id = ?', args: [result.lastInsertRowid] });
    return NextResponse.json(row.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
