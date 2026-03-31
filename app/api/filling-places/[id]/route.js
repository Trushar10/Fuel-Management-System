import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { name, is_mru, associate_vehicle } = await request.json();
    if (!name) return NextResponse.json({ error: 'Place name is required' }, { status: 400 });

    const db = await getDb();
    const old = await db.execute({ sql: 'SELECT * FROM filling_places WHERE id = ?', args: [id] });
    if (old.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const oldRow = old.rows[0];
    await db.execute({ sql: 'UPDATE filling_places SET name = ?, is_mru = ?, associate_vehicle = ? WHERE id = ?', args: [name.trim(), is_mru ? 1 : 0, (associate_vehicle || '').trim(), id] });

    // Cascade update to all fuel entries with this filling place
    await db.execute({
      sql: 'UPDATE fuel_entries SET filling_place = ? WHERE filling_place = ?',
      args: [name.trim(), oldRow.name],
    });

    const row = await db.execute({ sql: 'SELECT * FROM filling_places WHERE id = ?', args: [id] });
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
    await db.execute({ sql: 'DELETE FROM filling_places WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
