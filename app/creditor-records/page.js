'use client';
import { useState, useEffect, useRef } from 'react';

function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }

/* ── Autocomplete dropdown ────────────────────────────────── */
function AutocompleteField({ label, value, onChange, onSelect, suggestions, placeholder, required, readOnly }) {
  const [open, setOpen] = useState(false);
  const [hlIdx, setHlIdx] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setHlIdx(-1); }, [suggestions.length, open]);

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHlIdx(prev => { const next = prev < suggestions.length - 1 ? prev + 1 : 0; scrollToItem(next); return next; });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHlIdx(prev => { const next = prev > 0 ? prev - 1 : suggestions.length - 1; scrollToItem(next); return next; });
    } else if (e.key === 'Enter' && hlIdx >= 0) {
      e.preventDefault();
      onSelect(suggestions[hlIdx]); setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const scrollToItem = (idx) => {
    requestAnimationFrame(() => {
      const list = listRef.current;
      if (!list) return;
      const item = list.children[idx];
      if (item) item.scrollIntoView({ block: 'nearest' });
    });
  };

  return (
    <div ref={ref} className="form-group" style={{ position: 'relative' }}>
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="text" value={value} placeholder={placeholder} required={required} readOnly={readOnly}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => !readOnly && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="fc-input"
          style={readOnly ? { background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' } : {}}
        />
        {value && !readOnly && (
          <button type="button" onClick={() => { onSelect(null); setOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, padding: '0 4px' }}>
            ✕
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="autocomplete-list" ref={listRef}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => { onSelect(s); setOpen(false); }}
              className={`autocomplete-item${i === hlIdx ? ' active' : ''}`}>{s.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FuelCostPage() {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({ date: today, truck_no: '', driver_name: '', fuel_qty: '', fuel_rate: '', filling_place: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const [editId, setEditId] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [fuelRates, setFuelRates] = useState([]);

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  const [driverLocked, setDriverLocked] = useState(false);
  const [vehicleLocked, setVehicleLocked] = useState(false);
  const [placeLocked, setPlaceLocked] = useState(false);

  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');

  const [filterTruck, setFilterTruck] = useState('');
  const [filterDriver, setFilterDriver] = useState('');

  const loadMasters = () => {
    Promise.all([
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/filling-places').then(r => r.json()),
      fetch('/api/fuel-rates').then(r => r.json()),
    ]).then(([d, v, p, fr]) => {
      if (Array.isArray(d)) setDrivers(d);
      if (Array.isArray(v)) setVehicles(v);
      if (Array.isArray(p)) setPlaces(p);
      if (Array.isArray(fr)) setFuelRates(fr);
    });
  };

  const loadEntries = () => {
    setEntriesLoading(true);
    const params = new URLSearchParams();
    if (filterTruck) params.set('truck_no', filterTruck);
    if (filterDriver) params.set('driver_name', filterDriver);
    fetch(`/api/fuel-cost-entries?${params}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEntries(data); })
      .finally(() => setEntriesLoading(false));
  };

  useEffect(() => { loadMasters(); loadEntries(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!form.date || editId) return;
    if (fuelRates.length === 0) { setForm(prev => ({ ...prev, fuel_rate: '' })); return; }
    const onOrBefore = fuelRates.find(r => r.date <= form.date);
    const match = onOrBefore || fuelRates[fuelRates.length - 1];
    setForm(prev => ({ ...prev, fuel_rate: match.rate }));
  }, [form.date, fuelRates, editId]);

  const hasRateForDate = fuelRates.length > 0;

  const cost = form.fuel_qty && form.fuel_rate
    ? (Number(form.fuel_qty) * Number(form.fuel_rate)).toFixed(2)
    : '';

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); setSuccess(''); };

  const resetForm = () => {
    setForm({ date: today, truck_no: '', driver_name: '', fuel_qty: '', fuel_rate: '', filling_place: '' });
    setDriverSearch(''); setVehicleSearch(''); setPlaceSearch('');
    setDriverLocked(false); setVehicleLocked(false); setPlaceLocked(false);
    setEditId(null);
  };

  const startEdit = (entry) => {
    setForm({
      date: entry.date, truck_no: entry.truck_no, driver_name: entry.driver_name,
      fuel_qty: entry.fuel_qty, fuel_rate: entry.fuel_rate, filling_place: entry.filling_place,
    });
    setDriverSearch(entry.driver_name);
    setVehicleSearch(entry.truck_no);
    setPlaceSearch(entry.filling_place);
    setDriverLocked(true); setVehicleLocked(true); setPlaceLocked(true);
    setEditId(entry.id);
    setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const url = editId ? `/api/fuel-cost-entries/${editId}` : '/api/fuel-cost-entries';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed', 'error'); return; }
      showToast(editId ? 'Entry updated!' : 'Entry saved!', 'success');
      resetForm();
      loadEntries();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/fuel-cost-entries/${id}`, { method: 'DELETE' });
    loadEntries();
  };

  const driverSuggestions = driverSearch && !driverLocked
    ? drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()))
        .map(d => ({ label: `${d.name} — ${d.phone}`, value: d }))
    : [];
  const vehicleSuggestions = vehicleSearch && !vehicleLocked
    ? vehicles.filter(v => v.number.toLowerCase().includes(vehicleSearch.toLowerCase()))
        .map(v => ({ label: `${v.number} — ${v.brand}`, value: v }))
    : [];
  const placeSuggestions = placeSearch && !placeLocked
    ? places.filter(p => p.name.toLowerCase().includes(placeSearch.toLowerCase()))
        .map(p => ({ label: p.name, value: p }))
    : [];

  // Calculate totals
  const totalCost = entries.reduce((a, e) => a + Number(e.cost || 0), 0);
  const totalFuel = entries.reduce((a, e) => a + Number(e.fuel_qty || 0), 0);

  return (
    <>
      <div className="topbar">
        <div className="page-title">Creditor Records</div>
        <button className="topbar-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>+ Add Record</button>
      </div>

      <div className="content-area page-animate">
        <div className="page-head">
          <div>
            <div className="page-head-title">{editId ? 'Edit Creditor Record' : 'Creditor Records'}</div>
            <div className="page-head-sub">Manage fuel cost tracking</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="creditor-summary">
          <div className="cred-stat">
            <div className="cred-stat-val" style={{ color: 'var(--accent)' }}>
              ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="cred-stat-lbl">Total Cost</div>
          </div>
          <div className="cred-stat">
            <div className="cred-stat-val" style={{ color: 'var(--blue)' }}>
              {totalFuel.toLocaleString()} L
            </div>
            <div className="cred-stat-lbl">Total Fuel</div>
          </div>
          <div className="cred-stat">
            <div className="cred-stat-val" style={{ color: 'var(--green)' }}>
              {entries.length}
            </div>
            <div className="cred-stat-lbl">Total Records</div>
          </div>
        </div>

        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
          ))}
        </div>

        <div className="split-layout">
        <div className="split-left">
        {/* Form */}
        <form onSubmit={handleSubmit} className="form-card" style={{ marginBottom: 22 }}>
          <div className="section-header">
            <div className="section-num">{editId ? '✏' : '+'}</div>
            <div className="section-title">{editId ? 'Edit Record' : 'New Record'}</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required className="fc-input" />
            </div>
            <AutocompleteField
              label="Truck No." value={vehicleSearch} placeholder="e.g. GJ30T0728" required
              readOnly={vehicleLocked}
              onChange={val => { setVehicleSearch(val); setForm({ ...form, truck_no: val }); }}
              suggestions={vehicleSuggestions}
              onSelect={s => {
                if (s === null) { setVehicleSearch(''); setVehicleLocked(false); setForm({ ...form, truck_no: '' }); return; }
                setVehicleSearch(s.value.number); setVehicleLocked(true);
                setForm({ ...form, truck_no: s.value.number });
              }}
            />
            <AutocompleteField
              label="Driver Name" value={driverSearch} placeholder="Enter driver name" required
              readOnly={driverLocked}
              onChange={val => { setDriverSearch(val); setForm({ ...form, driver_name: val }); }}
              suggestions={driverSuggestions}
              onSelect={s => {
                if (s === null) { setDriverSearch(''); setDriverLocked(false); setForm({ ...form, driver_name: '' }); return; }
                setDriverSearch(s.value.name); setDriverLocked(true);
                setForm({ ...form, driver_name: s.value.name });
              }}
            />
            <div className="form-group">
              <label>Fuel Qty (Litres)</label>
              <div className="input-unit">
                <input type="number" name="fuel_qty" value={form.fuel_qty} onChange={handleChange}
                  placeholder="0" step="0.01" required className="fc-input" />
                <span className="unit-label">L</span>
              </div>
            </div>
            <div className="form-group">
              <label>
                Fuel Rate (₹/L)
                {hasRateForDate && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--green)' }}>from master</span>}
              </label>
              <div className="input-unit">
                <input type="number" name="fuel_rate" value={form.fuel_rate}
                  placeholder="0.00" step="0.01" required readOnly className="fc-input"
                  style={{ background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' }} />
                <span className="unit-label">₹/L</span>
              </div>
              {!hasRateForDate && form.date && (
                <span style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4 }}>No rate found. Add in Master Data.</span>
              )}
            </div>
            <AutocompleteField
              label="Place of Filling" value={placeSearch} placeholder="e.g. U.PUMP" required
              readOnly={placeLocked}
              onChange={val => { setPlaceSearch(val); setForm({ ...form, filling_place: val }); }}
              suggestions={placeSuggestions}
              onSelect={s => {
                if (s === null) { setPlaceSearch(''); setPlaceLocked(false); setForm({ ...form, filling_place: '' }); return; }
                setPlaceSearch(s.value.name); setPlaceLocked(true);
                setForm({ ...form, filling_place: s.value.name });
              }}
            />
          </div>

          {/* Cost preview */}
          <div className="cost-preview">
            <div className="cost-preview-label">Total Cost</div>
            <div className="cost-preview-value">
              {cost ? `₹ ${Number(cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
            </div>
          </div>

          <div className="form-actions">
            {editId && <button type="button" onClick={resetForm} className="btn btn-ghost">Cancel</button>}
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : editId ? '✓ Update' : '✓ Save Record'}
            </button>
          </div>
        </form>
        </div>

        <div className="split-right">
        {/* Filter & Table */}
        <form onSubmit={e => { e.preventDefault(); loadEntries(); }} className="toolbar">
          <div className="toolbar-search">
            <span style={{ color: 'var(--muted)' }}>🔍</span>
            <input type="text" placeholder="Filter by truck..." value={filterTruck} onChange={e => setFilterTruck(e.target.value)} />
          </div>
          <div className="toolbar-search" style={{ maxWidth: 220 }}>
            <span style={{ color: 'var(--muted)' }}>👤</span>
            <input type="text" placeholder="Filter by driver..." value={filterDriver} onChange={e => setFilterDriver(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Search</button>
        </form>

        {entriesLoading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : entries.length === 0 ? (
          <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No creditor records yet.</p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>VEHICLE</th>
                  <th>DRIVER</th>
                  <th style={{ textAlign: 'right' }}>FUEL (L)</th>
                  <th style={{ textAlign: 'right' }}>RATE (₹)</th>
                  <th style={{ textAlign: 'right' }}>COST (₹)</th>
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
                    <td style={{ textAlign: 'right' }}>{entry.fuel_qty} L</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(entry.fuel_rate).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }} className="td-main">₹{Number(entry.cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{entry.filling_place}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => startEdit(entry)} className="icon-btn">✏️</button>
                        <button onClick={() => handleDelete(entry.id)} className="icon-btn">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
        </div>
      </div>
    </>
  );
}
