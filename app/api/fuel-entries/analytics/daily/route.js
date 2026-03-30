import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const truck_no = searchParams.get('truck_no');
    const driver_name = searchParams.get('driver_name');
    const company = searchParams.get('company');

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'month parameter is required (YYYY-MM)' }, { status: 400 });
    }

    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(daysInMonth).padStart(2, '0')}`;

    const joins = [];
    const conditions = ['fe.date >= ?', 'fe.date <= ?'];
    const args = [startDate, endDate];

    if (company) {
      joins.push('LEFT JOIN vehicles v ON fe.truck_no = v.number');
      joins.push('LEFT JOIN drivers d ON fe.driver_name = d.name');
      conditions.push('(v.company = ? OR d.company = ?)');
      args.push(company, company);
    }

    if (truck_no) {
      conditions.push('fe.truck_no = ?');
      args.push(truck_no);
    }

    if (driver_name) {
      conditions.push('fe.driver_name = ?');
      args.push(driver_name);
    }

    const sql = `
      SELECT
        fe.date,
        ROUND(SUM(fe.fuel_qty), 2) as total_fuel,
        ROUND(SUM(fe.end_km - fe.start_km), 2) as total_distance,
        COUNT(*) as trip_count,
        ROUND(AVG(CASE WHEN fe.fuel_qty > 0 THEN (fe.end_km - fe.start_km) / fe.fuel_qty ELSE 0 END), 2) as avg_mileage
      FROM fuel_entries fe
      ${joins.join(' ')}
      WHERE ${conditions.join(' AND ')}
      GROUP BY fe.date
      ORDER BY fe.date ASC
    `;

    const result = await db.execute({ sql, args });

    const dailyData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const found = result.rows.find(r => r.date === dateStr);
      dailyData.push({
        date: dateStr,
        day,
        total_fuel: found ? Number(found.total_fuel) : 0,
        total_distance: found ? Number(found.total_distance) : 0,
        trip_count: found ? Number(found.trip_count) : 0,
        avg_mileage: found ? Number(found.avg_mileage) : 0,
      });
    }

    const activeDays = dailyData.filter(d => d.avg_mileage > 0);

    return NextResponse.json({
      month,
      days_in_month: daysInMonth,
      daily: dailyData,
      summary: {
        total_fuel: Math.round(dailyData.reduce((s, d) => s + d.total_fuel, 0) * 100) / 100,
        total_distance: Math.round(dailyData.reduce((s, d) => s + d.total_distance, 0) * 100) / 100,
        total_trips: dailyData.reduce((s, d) => s + d.trip_count, 0),
        avg_mileage: activeDays.length > 0
          ? Math.round(activeDays.reduce((s, d) => s + d.avg_mileage, 0) / activeDays.length * 100) / 100
          : 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
