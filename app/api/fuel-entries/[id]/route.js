import { NextResponse } from 'next/server';
import { getDb, withComputed } from '@/lib/db';

// GET /api/fuel-entries/[id]
export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM fuel_entries WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(withComputed(result.rows[0]));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/fuel-entries/[id]
export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { date, vehicle_no, driver_phone, driver_name, start_km, fuel_qty, end_km, filling_place, fuel_rate } = body;

    if (!date || !vehicle_no || !driver_phone || !driver_name || start_km == null || fuel_qty == null || end_km == null || !filling_place) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (Number(end_km) < Number(start_km)) {
      return NextResponse.json({ error: 'End KM must be >= Start KM' }, { status: 400 });
    }

    const db = await getDb();
    const fRate = Number(fuel_rate) || 0;
    const totalCost = fRate > 0 ? Number(fuel_qty) * fRate : 0;
    await db.execute({
      sql: `UPDATE fuel_entries SET date=?, vehicle_no=?, driver_phone=?, driver_name=?, start_km=?, fuel_qty=?, end_km=?, filling_place=?, fuel_rate=?, total_fuel_cost=?
            WHERE id=?`,
      args: [date, vehicle_no.trim(), driver_phone.trim(), driver_name.trim(),
             Number(start_km), Number(fuel_qty), Number(end_km), filling_place.trim(), fRate, Math.round(totalCost * 100) / 100, id],
    });

    const row = await db.execute({ sql: 'SELECT * FROM fuel_entries WHERE id = ?', args: [id] });
    if (row.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(withComputed(row.rows[0]));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/fuel-entries/[id]
export async function DELETE(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM fuel_entries WHERE id = ?', args: [id] });
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
