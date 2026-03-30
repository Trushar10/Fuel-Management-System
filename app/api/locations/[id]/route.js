import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Location name is required' }, { status: 400 });

    const db = await getDb();
    const old = await db.execute({ sql: 'SELECT * FROM locations WHERE id = ?', args: [id] });
    if (old.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.execute({ sql: 'UPDATE locations SET name = ? WHERE id = ?', args: [name.trim(), id] });
    const row = await db.execute({ sql: 'SELECT * FROM locations WHERE id = ?', args: [id] });
    return NextResponse.json(row.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM locations WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
