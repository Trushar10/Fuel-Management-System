'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }

const FORM_TYPES = [
  { key: 'trip', label: 'Trip Entry', api: '/api/fuel-entries', deleteApi: '/api/fuel-entries', editPath: '/edit' },
  { key: 'mobile', label: 'Mobile Refueling', api: '/api/fuel-cost-entries', deleteApi: '/api/fuel-cost-entries' },
  { key: 'purchase', label: 'Purchase', api: '/api/fuel-oil-entries', deleteApi: '/api/fuel-oil-entries' },
  { key: 'mru', label: 'MRU Entries', api: '/api/mru-entries', deleteApi: '/api/mru-entries' },
];

const COLUMNS = {
  trip: [
    { key: 'date', label: 'DATE', fmt: fmtDate, style: { fontSize: 11, color: 'var(--muted)' } },
    { key: 'truck_no', label: 'VEHICLE', cls: 'td-main' },
    { key: 'driver_name', label: 'DRIVER' },
    { key: 'driver_phone', label: 'PHONE', style: { fontSize: 11, color: 'var(--muted)' } },
    { key: 'fuel_qty', label: 'FUEL (L)', right: true, cls: 'td-main', suffix: ' L' },
    { key: 'distance', label: 'DISTANCE', right: true, cls: 'td-main', num: true, suffix: ' km' },
    { key: 'mileage', label: 'MILEAGE', right: true, badge: true },
    { key: 'filling_place', label: 'PLACE' },
  ],
  mobile: [
    { key: 'date', label: 'DATE', fmt: fmtDate, style: { fontSize: 11, color: 'var(--muted)' } },
    { key: 'truck_no', label: 'VEHICLE', cls: 'td-main' },
    { key: 'driver_name', label: 'DRIVER' },
    { key: 'fuel_qty', label: 'FUEL (L)', right: true, cls: 'td-main', suffix: ' L' },
    { key: 'fuel_rate', label: 'RATE', right: true, prefix: '₹' },
    { key: 'cost', label: 'COST', right: true, cls: 'td-main', prefix: '₹', num: true },
    { key: 'filling_place', label: 'PLACE' },
  ],
  purchase: [
    { key: 'date', label: 'DATE', fmt: fmtDate, style: { fontSize: 11, color: 'var(--muted)' } },
    { key: 'truck_no', label: 'VEHICLE', cls: 'td-main' },
    { key: 'driver_name', label: 'DRIVER' },
    { key: 'fuel_qty', label: 'QTY (L)', right: true, cls: 'td-main', suffix: ' L' },
    { key: 'fuel_rate', label: 'RATE', right: true, prefix: '₹' },
    { key: 'cost', label: 'COST', right: true, cls: 'td-main', prefix: '₹', num: true },
    { key: 'note', label: 'NOTE' },
  ],
  mru: [
    { key: 'date', label: 'DATE', fmt: fmtDate, style: { fontSize: 11, color: 'var(--muted)' } },
    { key: 'mru_name', label: 'MRU NAME', cls: 'td-main' },
    { key: 'truck_no', label: 'VEHICLE' },
    { key: 'driver_name', label: 'DRIVER' },
    { key: 'balance_stock', label: 'BAL. STOCK', right: true, suffix: ' L' },
    { key: 'qty', label: 'QTY (L)', right: true, cls: 'td-main', suffix: ' L' },
    { key: 'tank_balance', label: 'TANK BAL.', right: true, suffix: ' L' },
    { key: 'delivered_fuel', label: 'DELIVERED', right: true, suffix: ' L' },
  ],
};

export default function EntriesPage() {
  const [formType, setFormType] = useState('trip');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTruck, setSearchTruck] = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const formConfig = FORM_TYPES.find(f => f.key === formType);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTruck) params.set('truck_no', searchTruck);
    if (searchDriver) params.set('driver_name', searchDriver);
    if (fromDate) params.set('from_date', fromDate);
    if (toDate) params.set('to_date', toDate);
    const res = await fetch(`${formConfig.api}?${params}`);
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [formType]); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`${formConfig.api}/${id}`, { method: 'DELETE' });
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete all ${entries.length} entries? This cannot be undone.`)) return;
    await fetch(formConfig.deleteApi, { method: 'DELETE' });
    setEntries([]);
  };

  const clearFilters = () => {
    setSearchTruck('');
    setSearchDriver('');
    setFromDate('');
    setToDate('');
  };

  const hasFilters = searchTruck || searchDriver || fromDate || toDate;
  const cols = COLUMNS[formType] || [];

  const totalFuel = entries.reduce((a, e) => a + Number(e.fuel_qty || e.qty || 0), 0);

  return (
    <>
      <div className="topbar">
        <div className="page-title">All Entries</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/add" className="topbar-btn">+ New Entry</Link>
        </div>
      </div>

      <div className="content-area page-animate">
        {/* Form Type Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {FORM_TYPES.map(f => (
            <button key={f.key} onClick={() => { setFormType(f.key); setEntries([]); }}
              className={`btn ${formType === f.key ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: 12 }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="entries-stats">
          <div className="estat"><strong>{loading ? '...' : entries.length}</strong> Total Entries</div>
          <div className="estat">
            <strong>{loading ? '...' : totalFuel.toLocaleString()} L</strong> Total Fuel
          </div>
          {formType === 'trip' && (
            <div className="estat">
              <strong>{loading ? '...' : entries.reduce((a, e) => a + Number(e.distance || 0), 0).toLocaleString()} km</strong> Total Distance
            </div>
          )}
          {!loading && entries.length > 0 && (
            <button onClick={handleDeleteAll} className="btn btn-ghost" style={{ color: 'var(--red, #e74c3c)', marginLeft: 'auto', fontSize: 12 }}>🗑️ Delete All</button>
          )}
        </div>

        {/* Toolbar */}
        <form onSubmit={e => { e.preventDefault(); load(); }} className="toolbar">
          <div className="toolbar-search">
            <span style={{ color: 'var(--muted)' }}>🔍</span>
            <input type="text" placeholder="Search by truck no..." value={searchTruck} onChange={e => setSearchTruck(e.target.value)} />
          </div>
          <div className="toolbar-search" style={{ maxWidth: 240 }}>
            <span style={{ color: 'var(--muted)' }}>👤</span>
            <input type="text" placeholder="Search by driver..." value={searchDriver} onChange={e => setSearchDriver(e.target.value)} />
          </div>
          <div className="toolbar-search" style={{ maxWidth: 170 }}>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>From</span>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="toolbar-search" style={{ maxWidth: 170 }}>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>To</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Search</button>
          {hasFilters && (
            <button type="button" onClick={() => { clearFilters(); setTimeout(load, 0); }} className="btn btn-ghost">✕ Clear</button>
          )}
        </form>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : entries.length === 0 ? (
          <div className="form-card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
            <p style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>No entries found</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
              {hasFilters ? 'Try adjusting your filters' : 'No entries yet for this form type'}
            </p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  {cols.map(c => (
                    <th key={c.key} style={c.right ? { textAlign: 'right' } : {}}>{c.label}</th>
                  ))}
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    {cols.map(c => {
                      let val = entry[c.key];
                      if (c.fmt) val = c.fmt(val);
                      if (c.num) val = Number(val || 0).toLocaleString();
                      const display = `${c.prefix || ''}${val ?? ''}${c.suffix || ''}`;
                      if (c.badge) {
                        const m = Number(entry[c.key] || 0);
                        return (
                          <td key={c.key} style={{ textAlign: 'right' }}>
                            <span className={`badge ${m >= 4 ? 'badge-green' : m >= 2.5 ? 'badge-orange' : 'badge-red'}`}>
                              {m} km/L
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={c.key} className={c.cls || ''} style={{ ...(c.right ? { textAlign: 'right' } : {}), ...(c.style || {}) }}>
                          {display}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        {formConfig.editPath && <Link href={`${formConfig.editPath}/${entry.id}`} className="icon-btn">✏️</Link>}
                        <button onClick={() => handleDelete(entry.id)} className="icon-btn">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
            <div>Showing {entries.length} entries</div>
          </div>
        )}
      </div>
    </>
  );
}
