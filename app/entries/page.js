'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTruck, setSearchTruck] = useState('');
  const [searchDriver, setSearchDriver] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTruck) params.set('truck_no', searchTruck);
    if (searchDriver) params.set('driver_name', searchDriver);
    const res = await fetch(`/api/fuel-entries?${params}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/fuel-entries/${id}`, { method: 'DELETE' });
    setEntries(entries.filter(e => e.id !== id));
  };

  const clearFilters = () => {
    setSearchTruck('');
    setSearchDriver('');
  };

  const hasFilters = searchTruck || searchDriver;

  return (
    <>
      <div className="topbar">
        <div className="page-title">All Entries</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/add" className="topbar-btn">+ New Entry</Link>
        </div>
      </div>

      <div className="content-area page-animate">
        {/* Stats Bar */}
        <div className="entries-stats">
          <div className="estat"><strong>{loading ? '...' : entries.length}</strong> Total Entries</div>
          <div className="estat">
            <strong>{loading ? '...' : entries.reduce((a, e) => a + Number(e.fuel_qty || 0), 0).toLocaleString()} L</strong> Total Fuel
          </div>
          <div className="estat">
            <strong>{loading ? '...' : entries.reduce((a, e) => a + Number(e.distance || 0), 0).toLocaleString()} km</strong> Total Distance
          </div>
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
            <p style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>No fuel entries found</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
              {hasFilters ? 'Try adjusting your filters' : 'Start by adding your first entry'}
            </p>
            {!hasFilters && <Link href="/add" className="btn btn-primary">+ Add First Entry</Link>}
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>VEHICLE</th>
                  <th>DRIVER</th>
                  <th>PHONE</th>
                  <th style={{ textAlign: 'right' }}>START KM</th>
                  <th style={{ textAlign: 'right' }}>END KM</th>
                  <th style={{ textAlign: 'right' }}>DISTANCE</th>
                  <th style={{ textAlign: 'right' }}>FUEL (L)</th>
                  <th style={{ textAlign: 'right' }}>MILEAGE</th>
                  <th>PLACE</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(entry.date)}</td>
                    <td className="td-main">{entry.truck_no}</td>
                    <td>{entry.driver_name}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{entry.driver_phone}</td>
                    <td style={{ textAlign: 'right' }}>{Number(entry.start_km).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{Number(entry.end_km).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }} className="td-main">{Number(entry.distance).toLocaleString()} km</td>
                    <td style={{ textAlign: 'right' }} className="td-main">{entry.fuel_qty} L</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${entry.mileage >= 4 ? 'badge-green' : entry.mileage >= 2.5 ? 'badge-orange' : 'badge-red'}`}>
                        {entry.mileage} km/L
                      </span>
                    </td>
                    <td>{entry.filling_place}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <Link href={`/edit/${entry.id}`} className="icon-btn">✏️</Link>
                        <button onClick={() => handleDelete(entry.id)} className="icon-btn">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination hint */}
        {!loading && entries.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
            <div>Showing {entries.length} entries</div>
          </div>
        )}
      </div>
    </>
  );
}
