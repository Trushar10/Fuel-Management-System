import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { number, brand } = await request.json();
    if (!number || !brand) return NextResponse.json({ error: 'Vehicle number and brand are required' }, { status: 400 });

    const db = await getDb();
    const old = await db.execute({ sql: 'SELECT * FROM vehicles WHERE id = ?', args: [id] });
    if (old.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const oldRow = old.rows[0];
    await db.execute({ sql: 'UPDATE vehicles SET number = ?, brand = ? WHERE id = ?', args: [number.trim(), brand.trim(), id] });

    // Cascade update to all fuel entries with this vehicle
    await db.execute({
      sql: 'UPDATE fuel_entries SET truck_no = ? WHERE truck_no = ?',
      args: [number.trim(), oldRow.number],
    });

    const row = await db.execute({ sql: 'SELECT * FROM vehicles WHERE id = ?', args: [id] });
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
    await db.execute({ sql: 'DELETE FROM vehicles WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
