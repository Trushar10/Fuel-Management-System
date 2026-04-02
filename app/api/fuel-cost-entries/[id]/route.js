import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM fuel_cost_entries WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { date, vehicle_no, driver_name, fuel_qty, fuel_rate, filling_place } = body;

    if (!date || !vehicle_no || !driver_name || fuel_qty == null || fuel_rate == null || !filling_place) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const cost = Math.round(Number(fuel_qty) * Number(fuel_rate) * 100) / 100;

    const db = await getDb();
    await db.execute({
      sql: `UPDATE fuel_cost_entries SET date=?, vehicle_no=?, driver_name=?, fuel_qty=?, fuel_rate=?, cost=?, filling_place=?
            WHERE id=?`,
      args: [date, vehicle_no.trim(), driver_name.trim(), Number(fuel_qty), Number(fuel_rate), cost, filling_place.trim(), id],
    });

    const row = await db.execute({ sql: 'SELECT * FROM fuel_cost_entries WHERE id = ?', args: [id] });
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
    await db.execute({ sql: 'DELETE FROM fuel_cost_entries WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
