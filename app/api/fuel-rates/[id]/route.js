import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { date, rate } = await request.json();
    if (!date || rate == null) return NextResponse.json({ error: 'Date and rate are required' }, { status: 400 });
    if (Number(rate) <= 0) return NextResponse.json({ error: 'Rate must be > 0' }, { status: 400 });

    const db = await getDb();
    // Check for duplicate date (excluding current record)
    const dup = await db.execute({ sql: 'SELECT id FROM fuel_rates WHERE date = ? AND id != ?', args: [date, id] });
    if (dup.rows.length > 0) return NextResponse.json({ error: 'Rate for this date already exists' }, { status: 409 });

    await db.execute({ sql: 'UPDATE fuel_rates SET date = ?, rate = ? WHERE id = ?', args: [date, Number(rate), id] });
    const row = await db.execute({ sql: 'SELECT * FROM fuel_rates WHERE id = ?', args: [id] });
    if (row.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
    await db.execute({ sql: 'DELETE FROM fuel_rates WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
