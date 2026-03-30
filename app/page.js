'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PIE_COLORS = ['#f5a623', '#2de08a', '#4fa3ff', '#a78bfa', '#ff5252', '#06b6d4'];

const KPI_CONFIG = [
  { key: 'total_fuel', label: 'Total Fuel Used', unit: ' L', color: 'orange', icon: '⛽', dot: 'var(--accent)' },
  { key: 'total_entries', label: 'Active Trips', color: 'green', icon: '🚛', dot: 'var(--green)' },
  { key: 'total_distance', label: 'Total Distance', unit: ' km', color: 'blue', icon: '💰', dot: 'var(--blue)' },
  { key: 'avg_mileage', label: 'Avg Mileage', unit: ' km/L', color: 'purple', icon: '📍', dot: 'var(--purple)' },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byTruck, setByTruck] = useState([]);
  const [byDriver, setByDriver] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/fuel-entries/analytics/summary').then(r => r.json()),
      fetch('/api/fuel-entries/analytics/by-truck').then(r => r.json()),
      fetch('/api/fuel-entries/analytics/by-driver').then(r => r.json()),
      fetch('/api/fuel-entries/analytics/mileage-trend').then(r => r.json()),
    ]).then(([s, bt, bd, tr]) => {
      if (s.error) throw new Error(s.error);
      setSummary(s);
      setByTruck(bt);
      setByDriver(bd);
      setTrend(tr.slice(-30));
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <>
      <div className="topbar">
        <div className="page-title">Dashboard</div>
      </div>
      <div className="content-area">
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    </>
  );

  if (error) return (
    <>
      <div className="topbar">
        <div className="page-title">Dashboard</div>
      </div>
      <div className="content-area">
        <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--red)' }}>Error: {error}</p>
        </div>
      </div>
    </>
  );

  const isEmpty = !summary || Number(summary.total_entries) === 0;

  return (
    <>
      <div className="topbar">
        <div className="page-title">Dashboard</div>
        <div className="topbar-search">
          <span>🔍</span>
          <input type="text" placeholder="Search anything..." />
        </div>
        <Link href="/add" className="topbar-btn">+ New Trip</Link>
      </div>

      <div className="content-area page-animate">
        {/* KPI Cards */}
        <div className="kpi-grid">
          {KPI_CONFIG.map(({ key, label, unit, color, icon, dot }) => (
            <div key={key} className={`kpi-card ${color}`}>
              <div className="kpi-label">
                <span className="dot" style={{ background: dot }} />
                {label}
              </div>
              <div className="kpi-value">
                {summary?.[key] ? `${Number(summary[key]).toLocaleString()}` : '—'}
                {summary?.[key] && unit && (
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>{unit}</span>
                )}
              </div>
              <div className="kpi-icon">{icon}</div>
            </div>
          ))}
        </div>

        {isEmpty ? (
          <div className="form-card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⛽</div>
            <p style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>No fuel entries yet</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Add your first entry to see charts and analytics</p>
            <Link href="/add" className="btn btn-primary">+ Add First Entry</Link>
          </div>
        ) : (
          <>
            {/* Charts Row */}
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Mileage Trend</div>
                    <div className="chart-sub">km/L per entry</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ background: '#181c23', border: '1px solid #252b3a', borderRadius: 8, color: '#e8eaf0' }}
                      formatter={(v) => [`${v} km/L`, 'Mileage']}
                    />
                    <Line type="monotone" dataKey="mileage" stroke="#f5a623" strokeWidth={2} dot={{ r: 3, fill: '#f5a623' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Fuel by Vehicle</div>
                    <div className="chart-sub">Distribution this period</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={byTruck}
                      dataKey="total_fuel"
                      nameKey="truck_no"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {byTruck.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#181c23', border: '1px solid #252b3a', borderRadius: 8, color: '#e8eaf0' }}
                      formatter={(v) => [`${v} L`, 'Fuel']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 10 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="bottom-grid">
              {/* Fuel per Truck */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Fuel Filled per Truck (L)</div>
                    <div className="chart-sub">Bar comparison</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="truck_no" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ background: '#181c23', border: '1px solid #252b3a', borderRadius: 8, color: '#e8eaf0' }}
                      formatter={(v) => [`${v} L`, 'Fuel']}
                    />
                    <Bar dataKey="total_fuel" fill="#f5a623" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Avg Mileage per Truck */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Avg Mileage per Truck</div>
                    <div className="chart-sub">km/L comparison</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="truck_no" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ background: '#181c23', border: '1px solid #252b3a', borderRadius: 8, color: '#e8eaf0' }}
                      formatter={(v) => [`${v} km/L`, 'Avg Mileage']}
                    />
                    <Bar dataKey="avg_mileage" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
