const entries = [
  { date: '2026-03-01', truck_no: 'MH-12-AB-1234', driver_phone: '9876543210', driver_name: 'Rajesh Kumar',  start_km: 50000, fuel_qty: 120, end_km: 50480, filling_place: 'Mumbai HP Pump'   },
  { date: '2026-03-05', truck_no: 'MH-12-AB-1234', driver_phone: '9876543210', driver_name: 'Rajesh Kumar',  start_km: 50480, fuel_qty: 100, end_km: 50880, filling_place: 'Pune Indian Oil'   },
  { date: '2026-03-10', truck_no: 'MH-14-CD-5678', driver_phone: '9988776655', driver_name: 'Suresh Patil',  start_km: 30000, fuel_qty: 150, end_km: 30600, filling_place: 'Nashik BP'          },
  { date: '2026-03-15', truck_no: 'MH-14-CD-5678', driver_phone: '9988776655', driver_name: 'Suresh Patil',  start_km: 30600, fuel_qty: 130, end_km: 31120, filling_place: 'Mumbai HP Pump'   },
  { date: '2026-03-18', truck_no: 'GJ-01-XY-9012', driver_phone: '8877665544', driver_name: 'Amit Shah',     start_km: 70000, fuel_qty: 80,  end_km: 70350, filling_place: 'Ahmedabad IOCL'   },
  { date: '2026-03-22', truck_no: 'GJ-01-XY-9012', driver_phone: '8877665544', driver_name: 'Amit Shah',     start_km: 70350, fuel_qty: 90,  end_km: 70710, filling_place: 'Surat HP Pump'    },
  { date: '2026-03-25', truck_no: 'MH-12-AB-1234', driver_phone: '9876543210', driver_name: 'Rajesh Kumar',  start_km: 50880, fuel_qty: 110, end_km: 51320, filling_place: 'Pune Indian Oil'   },
  { date: '2026-03-28', truck_no: 'RJ-14-EF-3456', driver_phone: '7766554433', driver_name: 'Vikram Singh',  start_km: 20000, fuel_qty: 140, end_km: 20700, filling_place: 'Jaipur BPCL'       },
];

(async () => {
  for (const e of entries) {
    const res = await fetch('http://localhost:3002/api/fuel-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    });
    const data = await res.json();
    console.log('Added id=' + data.id, e.truck_no, e.date);
  }
  console.log('Done!');
})();
