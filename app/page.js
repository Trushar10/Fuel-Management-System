'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month) {
  const [y, m] = month.split('-');
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driversLoaded, setDriversLoaded] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // Load filter options once
  useEffect(() => {
    Promise.all([
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/drivers').then(r => r.json()),
    ]).then(([v, d]) => {
      setVehicles(Array.isArray(v) ? v : []);
      const driverList = Array.isArray(d) ? d : [];
      setDrivers(driverList);
      if (driverList.length > 0) setDriver(driverList[0].name);
      setDriversLoaded(true);
    }).catch(() => { setDriversLoaded(true); });
  }, []);

  const fetchData = useCallback(() => {
    if (!driversLoaded) return;
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (vehicle) params.set('truck_no', vehicle);
    if (driver) params.set('driver_name', driver);

    fetch(`/api/fuel-entries/analytics/daily?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(err => showToast(err.message))
      .finally(() => setLoading(false));
  }, [month, vehicle, driver, driversLoaded]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReset = () => {
    setVehicle('');
    setDriver(drivers.length > 0 ? drivers[0].name : '');
  };

  const prevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const summary = data?.summary;
  const daily = data?.daily || [];
  const isEmpty = !summary || summary.total_trips === 0;

  const tooltipStyle = { background: '#181c23', border: '1px solid #252b3a', borderRadius: 8, color: '#e8eaf0' };

  const filterLabel = [driver, vehicle].filter(Boolean).join(' · ') || 'All';

  return (
    <>
      <div className="topbar">
        <div className="page-title">Dashboard</div>
        <Link href="/add" className="topbar-btn">+ New Trip</Link>
      </div>

      <div className="content-area page-animate">
        {/* Toast */}
        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
            ))}
          </div>
        )}

        {/* Month Navigation */}
        <div className="form-card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '6px 14px' }}>◀</button>
            <span style={{ fontWeight: 600, fontSize: 16, minWidth: 160, textAlign: 'center' }}>
              {formatMonthLabel(month)}
            </span>
            <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '6px 14px' }}>▶</button>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            {data ? `${data.days_in_month} days` : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="form-card" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>🔍 Filters</span>
            {(vehicle || (driver && drivers.length > 0 && driver !== drivers[0].name)) && (
              <button onClick={handleReset} className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 10px', marginLeft: 'auto' }}>
                Reset
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Driver</label>
              <select className="form-input" value={driver} onChange={e => setDriver(e.target.value)}>
                <option value="">All Drivers</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Vehicle</label>
              <select className="form-input" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                <option value="">All Vehicles</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.number}>{v.number}{v.brand ? ` (${v.brand})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <>
            {isEmpty ? (
              <div className="form-card" style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⛽</div>
                <p style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>No data for {formatMonthLabel(month)}</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
                  {vehicle || driver ? 'Try changing filters or selecting a different month' : 'No fuel entries found for this month'}
                </p>
                <Link href="/add" className="btn btn-primary">+ Add Entry</Link>
              </div>
            ) : (
              <>
                {/* Daily Avg Mileage Trend — First */}
                <div className="chart-card" style={{ marginBottom: 16 }}>
                  <div className="chart-header">
                    <div>
                      <div className="chart-title">Daily Avg Mileage (km/L) — {filterLabel}</div>
                      <div className="chart-sub">{formatMonthLabel(month)} — {data.days_in_month} days</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={daily.filter(d => d.avg_mileage > 0)} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelFormatter={(day) => {
                          const d = daily.find(x => x.day === day);
                          return d ? d.date : `Day ${day}`;
                        }}
                        formatter={(v) => [`${v} km/L`, 'Mileage']}
                      />
                      <Line type="monotone" dataKey="avg_mileage" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Charts Row — Fuel Usage (left) + Distance (right) */}
                <div className="charts-row">
                  {/* Daily Fuel Usage Chart */}
                  <div className="chart-card">
                    <div className="chart-header">
                      <div>
                        <div className="chart-title">Daily Fuel Usage (L) — {filterLabel}</div>
                        <div className="chart-sub">{formatMonthLabel(month)}</div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelFormatter={(day) => {
                            const d = daily.find(x => x.day === day);
                            return d ? d.date : `Day ${day}`;
                          }}
                          formatter={(v, name) => {
                            if (name === 'total_fuel') return [`${v} L`, 'Fuel'];
                            return [v, name];
                          }}
                        />
                        <Bar dataKey="total_fuel" fill="#f5a623" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Daily Distance Chart */}
                  <div className="chart-card">
                    <div className="chart-header">
                      <div>
                        <div className="chart-title">Daily Distance (km) — {filterLabel}</div>
                        <div className="chart-sub">{formatMonthLabel(month)}</div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelFormatter={(day) => {
                            const d = daily.find(x => x.day === day);
                            return d ? d.date : `Day ${day}`;
                          }}
                          formatter={(v) => [`${v} km`, 'Distance']}
                        />
                        <Bar dataKey="total_distance" fill="#4fa3ff" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
