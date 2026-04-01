'use client';
import { useState, useEffect, useRef } from 'react';

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

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  truck_no: '', driver_name: '',
  fuel_qty: '', fuel_rate: '', cost: '', note: '',
};

export default function FuelOilPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);

  const [staff, setStaff] = useState([]);
  const [fuelRates, setFuelRates] = useState([]);

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
    fetch('/api/fuel-oil-entries')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentEntries(data.slice(0, 10)); });
  };

  const loadMasters = () => {
    Promise.all([
      fetch('/api/staff').then(r => r.json()),
      fetch('/api/fuel-rates').then(r => r.json()),
    ]).then(([s, fr]) => {
      if (Array.isArray(s)) setStaff(s);
      if (Array.isArray(fr)) setFuelRates(fr);
    });
  };

  useEffect(() => { loadRecent(); loadMasters(); }, []);

  // Auto-fill fuel rate from latest diesel rate
  useEffect(() => {
    if (fuelRates.length > 0 && !form.fuel_rate) {
      const dieselRate = fuelRates.find(r => (r.fuel_type || 'Diesel').toLowerCase() === 'diesel');
      if (dieselRate) setForm(prev => prev.fuel_rate ? prev : { ...prev, fuel_rate: String(dieselRate.rate) });
    }
  }, [fuelRates]); // eslint-disable-line

  // Auto-calculate cost = fuel_qty × fuel_rate
  useEffect(() => {
    const qty = Number(form.fuel_qty) || 0;
    const rate = Number(form.fuel_rate) || 0;
    const cost = qty > 0 && rate > 0 ? Math.round(qty * rate * 100) / 100 : '';
    setForm(prev => ({ ...prev, cost: cost !== '' ? String(cost) : '' }));
  }, [form.fuel_qty, form.fuel_rate]);

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      fuel_rate: fuelRates.length > 0 ? String((fuelRates.find(r => (r.fuel_type || 'Diesel').toLowerCase() === 'diesel') || fuelRates[0]).rate) : '',
    });
    setDriverSearch(''); setVehicleSearch('');
    setDriverLocked(false); setVehicleLocked(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const staffVehicles = staff.filter(s => s.vehicle_number).map(s => s.vehicle_number.toLowerCase());
    if (!staffVehicles.includes(form.truck_no.trim().toLowerCase())) {
      showToast('Truck No. must be selected from staff list', 'error'); return;
    }
    if (!staff.some(s => s.name.toLowerCase() === form.driver_name.trim().toLowerCase())) {
      showToast('Driver Name must be selected from staff list', 'error'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/fuel-oil-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed', 'error'); return; }
      showToast('Fuel & Oil entry saved!', 'success');
      resetForm();
      loadRecent();
    } finally { setLoading(false); }
  };

  const driverSuggestions = driverSearch && !driverLocked
    ? staff.filter(s => s.name.toLowerCase().includes(driverSearch.toLowerCase()))
        .map(s => ({ label: `${s.name}${s.vehicle_number ? ` — ${s.vehicle_number}` : ''}`, value: s }))
    : [];
  const vehicleSuggestions = vehicleSearch && !vehicleLocked
    ? staff.filter(s => s.vehicle_number && s.vehicle_number.toLowerCase().includes(vehicleSearch.toLowerCase()))
        .map(s => ({ label: `${s.vehicle_number} — ${s.name}`, value: { number: s.vehicle_number } }))
    : [];

  function fmtDate(d) { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; }

  return (
    <>
      <div className="topbar">
        <div className="page-title">Fuel & Oil Entry</div>
      </div>

      <div className="content-area page-animate">
        <div className="page-head">
          <div>
            <div className="page-head-title">Fuel & Oil Entry</div>
            <div className="page-head-sub">Record fuel and oil purchases</div>
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
              {/* Section 1: Entry Details */}
              <div className="form-card">
                <div className="section-header">
                  <div className="section-num">1</div>
                  <div className="section-title">Entry Details</div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required className="fc-input" />
                  </div>
                  <AutocompleteField
                    label="Truck No." value={vehicleSearch} placeholder="e.g. GJ-05-AB-1234" required
                    readOnly={vehicleLocked}
                    onChange={val => { const fmt = formatVehicleNumber(val); setVehicleSearch(fmt); setForm(prev => ({ ...prev, truck_no: fmt })); }}
                    suggestions={vehicleSuggestions}
                    onSelect={s => {
                      if (s === null) { setVehicleSearch(''); setVehicleLocked(false); setForm(prev => ({ ...prev, truck_no: '' })); return; }
                      setVehicleSearch(s.value.number); setVehicleLocked(true);
                      setForm(prev => ({ ...prev, truck_no: s.value.number }));
                      const matched = staff.find(st => st.vehicle_number && st.vehicle_number.toLowerCase() === s.value.number.toLowerCase());
                      if (matched) {
                        setDriverSearch(matched.name); setDriverLocked(true);
                        setForm(prev => ({ ...prev, driver_name: matched.name }));
                        const fType = (matched.fuel_type || 'Diesel').toLowerCase();
                        const rate = fuelRates.find(r => (r.fuel_type || 'Diesel').toLowerCase() === fType);
                        if (rate) setForm(prev => ({ ...prev, fuel_rate: String(rate.rate) }));
                      }
                    }}
                  />
                  <AutocompleteField
                    label="Driver Name" value={driverSearch} placeholder="Enter staff name" required
                    readOnly={driverLocked}
                    onChange={val => { setDriverSearch(val); setForm(prev => ({ ...prev, driver_name: val })); }}
                    suggestions={driverSuggestions}
                    onSelect={s => {
                      if (s === null) { setDriverSearch(''); setDriverLocked(false); setForm(prev => ({ ...prev, driver_name: '' })); return; }
                      setDriverSearch(s.value.name); setDriverLocked(true);
                      setForm(prev => ({ ...prev, driver_name: s.value.name }));
                    }}
                  />
                </div>
              </div>

              {/* Section 2: Fuel Details */}
              <div className="form-card">
                <div className="section-header">
                  <div className="section-num">2</div>
                  <div className="section-title">Fuel Details</div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Fuel QTY (Litres)</label>
                    <div className="input-unit">
                      <input type="number" name="fuel_qty" value={form.fuel_qty} onChange={handleChange}
                        placeholder="0" step="0.01" required className="fc-input" />
                      <span className="unit-label">L</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Fuel Rate (₹/L)</label>
                    <div className="input-unit">
                      <input type="number" name="fuel_rate" value={form.fuel_rate} onChange={handleChange}
                        placeholder="0" step="0.01" required className="fc-input" />
                      <span className="unit-label">₹</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cost (auto)</label>
                    <input type="text" readOnly value={form.cost ? `₹ ${Number(form.cost).toLocaleString()}` : '—'} className="fc-input"
                      style={{ background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Note <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(Optional)</span></label>
                    <input type="text" name="note" value={form.note} onChange={handleChange}
                      placeholder="Any additional notes..." className="fc-input" />
                  </div>
                </div>

                {/* Summary */}
                <div className="cost-preview" style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <div className="cost-preview-label">Quantity</div>
                      <div className="cost-preview-value">{form.fuel_qty ? `${form.fuel_qty} L` : '—'}</div>
                    </div>
                    <div>
                      <div className="cost-preview-label">Rate</div>
                      <div className="cost-preview-value">{form.fuel_rate ? `₹ ${form.fuel_rate}/L` : '—'}</div>
                    </div>
                    <div>
                      <div className="cost-preview-label">Total Cost</div>
                      <div className="cost-preview-value">{form.cost ? `₹ ${Number(form.cost).toLocaleString()}` : '—'}</div>
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
                  <div className="table-title">Recent Entries</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>VEHICLE</th>
                        <th>DRIVER</th>
                        <th style={{ textAlign: 'right' }}>QTY (L)</th>
                        <th style={{ textAlign: 'right' }}>RATE</th>
                        <th style={{ textAlign: 'right' }}>COST</th>
                        <th>NOTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(entry.date)}</td>
                          <td className="td-main">{entry.truck_no}</td>
                          <td>{entry.driver_name}</td>
                          <td style={{ textAlign: 'right' }}>{entry.fuel_qty} L</td>
                          <td style={{ textAlign: 'right' }}>₹{entry.fuel_rate}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="badge badge-green">₹{Number(entry.cost).toLocaleString()}</span>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.note || '—'}</td>
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
