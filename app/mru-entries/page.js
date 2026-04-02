'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function fmtDate(d) { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; }

export default function MRUEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVehicle, setSearchTruck] = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [searchMru, setSearchMru] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/mru-entries');
    const data = await res.json();
    if (Array.isArray(data)) {
      let filtered = data;
      if (searchVehicle) filtered = filtered.filter(e => e.vehicle_no?.toLowerCase().includes(searchVehicle.toLowerCase()));
      if (searchDriver) filtered = filtered.filter(e => e.driver_name?.toLowerCase().includes(searchDriver.toLowerCase()));
      if (searchMru) filtered = filtered.filter(e => e.mru_name?.toLowerCase().includes(searchMru.toLowerCase()));
      setEntries(filtered);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!confirm('Delete this MRU entry?')) return;
    await fetch(`/api/mru-entries/${id}`, { method: 'DELETE' });
    setEntries(entries.filter(e => e.id !== id));
  };

  const clearFilters = () => {
    setSearchTruck('');
    setSearchDriver('');
    setSearchMru('');
  };

  const hasFilters = searchVehicle || searchDriver || searchMru;

  const totalFilled = entries.reduce((a, e) => a + Number(e.qty || 0), 0);
  const totalDelivered = entries.reduce((a, e) => a + Number(e.delivered_fuel || 0), 0);

  return (
    <>
      <div className="topbar">
        <div className="page-title">MRU Entries</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/mobile-refueling" className="topbar-btn">+ New MRU Entry</Link>
        </div>
      </div>

      <div className="content-area page-animate">
        {/* Stats Bar */}
        <div className="entries-stats">
          <div className="estat"><strong>{loading ? '...' : entries.length}</strong> Total Entries</div>
          <div className="estat">
            <strong>{loading ? '...' : totalFilled.toLocaleString()} L</strong> Total Filled
          </div>
          <div className="estat">
            <strong>{loading ? '...' : totalDelivered.toLocaleString()} L</strong> Total Delivered
          </div>
        </div>

        {/* Toolbar */}
        <form onSubmit={e => { e.preventDefault(); load(); }} className="toolbar">
          <div className="toolbar-search">
            <span style={{ color: 'var(--muted)' }}>🔍</span>
            <input type="text" placeholder="Search by truck no..." value={searchVehicle} onChange={e => setSearchTruck(e.target.value)} />
          </div>
          <div className="toolbar-search" style={{ maxWidth: 240 }}>
            <span style={{ color: 'var(--muted)' }}>👤</span>
            <input type="text" placeholder="Search by driver..." value={searchDriver} onChange={e => setSearchDriver(e.target.value)} />
          </div>
          <div className="toolbar-search" style={{ maxWidth: 240 }}>
            <span style={{ color: 'var(--muted)' }}>🛢️</span>
            <input type="text" placeholder="Search by MRU..." value={searchMru} onChange={e => setSearchMru(e.target.value)} />
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
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🛢️</div>
            <p style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>No MRU entries found</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
              {hasFilters ? 'Try adjusting your filters' : 'Start by adding your first MRU entry'}
            </p>
            {!hasFilters && <Link href="/mobile-refueling" className="btn btn-primary">+ Add First Entry</Link>}
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>MRU</th>
                  <th>VEHICLE</th>
                  <th>DRIVER</th>
                  <th>PHONE</th>
                  <th style={{ textAlign: 'right' }}>STOCK (L)</th>
                  <th style={{ textAlign: 'right' }}>FILLED QTY (L)</th>
                  <th style={{ textAlign: 'right' }}>BALANCE (L)</th>
                  <th style={{ textAlign: 'right' }}>DELIVERED (L)</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(entry.date)}</td>
                    <td>{entry.mru_name || '—'}</td>
                    <td className="td-main">{entry.vehicle_no}</td>
                    <td>{entry.driver_name}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{entry.driver_phone}</td>
                    <td style={{ textAlign: 'right' }}>{entry.balance_stock} L</td>
                    <td style={{ textAlign: 'right' }}>{entry.qty} L</td>
                    <td style={{ textAlign: 'right' }}>{entry.tank_balance} L</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-green">{entry.delivered_fuel} L</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleDelete(entry.id)} className="icon-btn">🗑️</button>
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
