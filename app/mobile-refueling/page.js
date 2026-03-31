'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const formatVehicleNumber = (raw) => {
  const v = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let result = '', i = 0;
  while (i < v.length && /[A-Z]/.test(v[i])) { result += v[i++]; }
  if (i < v.length) { result += '-'; }
  while (i < v.length && /[0-9]/.test(v[i])) { result += v[i++]; }
  if (i < v.length) { result += '-'; }
  while (i < v.length && /[A-Z]/.test(v[i])) { result += v[i++]; }
  if (i < v.length) { result += '-'; }
  while (i < v.length && /[0-9]/.test(v[i])) { result += v[i++]; }
  return result;
};

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

  useEffect(() => { setHlIdx(-1); }, [suggestions.length, open]); // eslint-disable-line react-hooks/exhaustive-deps

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
    } else if (e.key === 'Escape') { setOpen(false); }
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
        <input type="text" value={value} placeholder={placeholder} required={required} readOnly={readOnly}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => !readOnly && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="fc-input"
          style={readOnly ? { background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' } : {}}
        />
        {value && !readOnly && (
          <button type="button" onClick={() => { onSelect(null); setOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, padding: '0 4px' }}>✕</button>
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

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  truck_no: '', driver_phone: '', driver_name: '',
  mru_name: '',
  balance_stock: '', qty: '', tank_balance: '', delivered_fuel: '',
};

export default function MRUPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [residualFuel, setResidualFuel] = useState([]);
  const [mruPlaces, setMruPlaces] = useState([]);

  const [driverLocked, setDriverLocked] = useState(false);
  const [vehicleLocked, setVehicleLocked] = useState(false);
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const loadRecent = () => {
    fetch('/api/mru-entries')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentEntries(data.slice(0, 10)); });
  };

  const loadMasters = () => {
    Promise.all([
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/residual-fuel').then(r => r.json()),
      fetch('/api/filling-places').then(r => r.json()),
    ]).then(([d, v, rf, fp]) => {
      if (Array.isArray(d)) setDrivers(d);
      if (Array.isArray(v)) setVehicles(v);
      if (Array.isArray(rf)) setResidualFuel(rf);
      if (Array.isArray(fp)) setMruPlaces(fp.filter(p => p.is_mru));
    });
  };

  useEffect(() => { loadRecent(); loadMasters(); }, []);

  // Auto-set balance_stock from latest MRU entry's remaining, or fallback to residual fuel
  useEffect(() => {
    if (recentEntries.length > 0) {
      setForm(prev => prev.balance_stock ? prev : { ...prev, balance_stock: String(recentEntries[0].tank_balance) });
    } else if (residualFuel.length > 0) {
      setForm(prev => prev.balance_stock ? prev : { ...prev, balance_stock: String(residualFuel[0].opening_balance) });
    }
  }, [recentEntries, residualFuel]);

  // Auto-calculate tank_balance = balance_stock + filled_qty
  useEffect(() => {
    const stock = Number(form.balance_stock) || 0;
    const qty = Number(form.qty) || 0;
    const tankBalance = stock + qty;
    setForm(prev => ({
      ...prev,
      tank_balance: tankBalance > 0 ? String(Math.round(tankBalance * 100) / 100) : '',
    }));
  }, [form.balance_stock, form.qty]);

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      balance_stock: residualFuel.length > 0 ? String(residualFuel[0].opening_balance) : '',
    });
    setDriverSearch(''); setVehicleSearch('');
    setDriverLocked(false); setVehicleLocked(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicles.some(v => v.number.toLowerCase() === form.truck_no.trim().toLowerCase())) {
      showToast('Truck No. must be selected from master data', 'error'); return;
    }
    if (!drivers.some(d => d.name.toLowerCase() === form.driver_name.trim().toLowerCase())) {
      showToast('Driver Name must be selected from master data', 'error'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/mru-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tank_balance: String(Math.round(((Number(form.tank_balance) || 0) - (Number(form.delivered_fuel) || 0)) * 100) / 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed', 'error'); return; }
      showToast('MRU entry saved successfully!', 'success');
      // After saving, update balance stock for next entry (remaining = tank_balance - delivered_fuel)
      const remaining = String(Math.round(((Number(form.tank_balance) || 0) - (Number(form.delivered_fuel) || 0)) * 100) / 100);
      resetForm();
      setForm(prev => ({ ...prev, balance_stock: remaining }));
      loadRecent();
    } finally { setLoading(false); }
  };

  const driverSuggestions = driverSearch && !driverLocked
    ? drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()))
        .map(d => ({ label: `${d.name} — ${d.phone}`, value: d }))
    : [];
  const vehicleSuggestions = vehicleSearch && !vehicleLocked
    ? vehicles.filter(v => v.number.toLowerCase().includes(vehicleSearch.toLowerCase()))
        .map(v => ({ label: `${v.number} — ${v.brand}`, value: v }))
    : [];


  return (
    <>
      <div className="topbar">
        <div className="page-title">Mobile Refueling Unit</div>
      </div>

      <div className="content-area page-animate">
        <div className="page-head">
          <div>
            <div className="page-head-title">Mobile Refueling Unit</div>
            <div className="page-head-sub">Record fuel deliveries from the mobile tanker</div>
          </div>
        </div>

        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
          ))}
        </div>

        <div className="split-layout">
          <div className="split-left">
            <form onSubmit={handleSubmit}>
              {/* Section 1: Delivery Info */}
              <div className="form-card">
                <div className="section-header">
                  <div className="section-num">1</div>
                  <div className="section-title">Delivery Information</div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required className="fc-input" />
                  </div>
                  <div className="form-group">
                    <label>MRU Name</label>
                    <select name="mru_name" value={form.mru_name} onChange={e => {
                      const name = e.target.value;
                      const place = mruPlaces.find(p => p.name === name);
                      const vehicle = place?.associate_vehicle || '';
                      setForm(prev => ({ ...prev, mru_name: name, truck_no: vehicle || prev.truck_no }));
                      if (vehicle) { setVehicleSearch(vehicle); setVehicleLocked(true); }
                    }} required className="fc-input">
                      <option value="">Select Mobile Refueling Unit</option>
                      {mruPlaces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <AutocompleteField
                    label="Truck No." value={vehicleSearch} placeholder="e.g. GJ-05-AB-1234" required
                    readOnly={vehicleLocked}
                    onChange={val => { const fmt = formatVehicleNumber(val); setVehicleSearch(fmt); setForm({ ...form, truck_no: fmt }); }}
                    suggestions={vehicleSuggestions}
                    onSelect={s => {
                      if (s === null) { setVehicleSearch(''); setVehicleLocked(false); setForm({ ...form, truck_no: '' }); return; }
                      setVehicleSearch(s.value.number); setVehicleLocked(true);
                      setForm({ ...form, truck_no: s.value.number });
                    }}
                  />
                </div>
              </div>

              {/* Section 2: Driver Details */}
              <div className="form-card">
                <div className="section-header">
                  <div className="section-num">2</div>
                  <div className="section-title">Driver Details</div>
                </div>
                <div className="form-grid">
                  <AutocompleteField
                    label="Driver Name" value={driverSearch} placeholder="Enter driver name" required
                    readOnly={driverLocked}
                    onChange={val => { setDriverSearch(val); setForm({ ...form, driver_name: val, driver_phone: '' }); }}
                    suggestions={driverSuggestions}
                    onSelect={s => {
                      if (s === null) { setDriverSearch(''); setDriverLocked(false); setForm({ ...form, driver_name: '', driver_phone: '' }); return; }
                      setDriverSearch(s.value.name); setDriverLocked(true);
                      setForm({ ...form, driver_name: s.value.name, driver_phone: s.value.phone });
                    }}
                  />
                  <div className="form-group">
                    <label>Driver Phone No.</label>
                    <input type="tel" name="driver_phone" value={form.driver_phone} placeholder="e.g. 9876543210"
                      onChange={handleChange} required readOnly={driverLocked} className="fc-input"
                      style={driverLocked ? { background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' } : {}}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Fuel Details */}
              <div className="form-card">
                <div className="section-header">
                  <div className="section-num">3</div>
                  <div className="section-title">Fuel Details</div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Balance Stock (L)</label>
                    <div className="input-unit">
                      <input type="number" name="balance_stock" value={form.balance_stock} readOnly
                        placeholder="0" step="0.01" required className="fc-input"
                        style={{ background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' }} />
                      <span className="unit-label">L</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Filled QTY (Litres)</label>
                    <div className="input-unit">
                      <input type="number" name="qty" value={form.qty} onChange={handleChange}
                        placeholder="0" step="0.01" required className="fc-input" />
                      <span className="unit-label">L</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tank Balance (auto)</label>
                    <div className="input-unit">
                      <input type="number" name="tank_balance" value={form.tank_balance} readOnly className="fc-input"
                        style={{ background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' }} />
                      <span className="unit-label">L</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Delivered Fuel</label>
                    <div className="input-unit">
                      <input type="number" name="delivered_fuel" value={form.delivered_fuel} onChange={handleChange}
                        placeholder="0" step="0.01" required className="fc-input" />
                      <span className="unit-label">L</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="cost-preview" style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <div className="cost-preview-label">Balance Stock</div>
                      <div className="cost-preview-value">{form.balance_stock ? `${form.balance_stock} L` : '—'}</div>
                    </div>
                    <div>
                      <div className="cost-preview-label">Delivered</div>
                      <div className="cost-preview-value">{form.delivered_fuel ? `${form.delivered_fuel} L` : '—'}</div>
                    </div>
                    <div>
                      <div className="cost-preview-label">Remaining</div>
                      <div className="cost-preview-value">{(Number(form.tank_balance) || 0) - (Number(form.delivered_fuel) || 0) > 0 ? `${Math.round(((Number(form.tank_balance) || 0) - (Number(form.delivered_fuel) || 0)) * 100) / 100} L` : '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={resetForm} className="btn btn-ghost">Clear</button>
                  <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? 'Saving...' : '✓ Submit Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <div className="split-right">
              <div className="table-card">
                <div className="table-head">
                  <div className="table-title">Recent MRU Entries</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>VEHICLE</th>
                        <th>DRIVER</th>
                        <th style={{ textAlign: 'right' }}>STOCK</th>
                        <th style={{ textAlign: 'right' }}>FILLED QTY (L)</th>
                        <th style={{ textAlign: 'right' }}>BALANCE</th>
                        <th style={{ textAlign: 'right' }}>DELIVERED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ fontSize: 11, color: 'var(--muted)' }}>{entry.date}</td>
                          <td className="td-main">{entry.truck_no}</td>
                          <td>{entry.driver_name}</td>
                          <td style={{ textAlign: 'right' }}>{entry.balance_stock} L</td>
                          <td style={{ textAlign: 'right' }}>{entry.qty} L</td>
                          <td style={{ textAlign: 'right' }}>{entry.tank_balance} L</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="badge badge-green">{entry.delivered_fuel} L</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
