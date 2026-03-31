import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { number, company } = await request.json();
    if (!number) return NextResponse.json({ error: 'Vehicle number is required' }, { status: 400 });

    const db = await getDb();
    const old = await db.execute({ sql: 'SELECT * FROM rented_vehicles WHERE id = ?', args: [id] });
    if (old.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.execute({ sql: 'UPDATE rented_vehicles SET number = ?, company = ? WHERE id = ?', args: [number.trim(), (company || '').trim(), id] });

    const row = await db.execute({ sql: 'SELECT * FROM rented_vehicles WHERE id = ?', args: [id] });
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
    await db.execute({ sql: 'DELETE FROM rented_vehicles WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
