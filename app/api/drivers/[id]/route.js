import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { name, phone } = await request.json();
    if (!name || !phone) return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });

    const db = await getDb();
    const old = await db.execute({ sql: 'SELECT * FROM drivers WHERE id = ?', args: [id] });
    if (old.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const oldRow = old.rows[0];
    await db.execute({ sql: 'UPDATE drivers SET name = ?, phone = ? WHERE id = ?', args: [name.trim(), phone.trim(), id] });

    // Cascade update to all fuel entries with this driver
    await db.execute({
      sql: 'UPDATE fuel_entries SET driver_name = ?, driver_phone = ? WHERE driver_name = ? AND driver_phone = ?',
      args: [name.trim(), phone.trim(), oldRow.name, oldRow.phone],
    });

    const row = await db.execute({ sql: 'SELECT * FROM drivers WHERE id = ?', args: [id] });
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
    await db.execute({ sql: 'DELETE FROM drivers WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
