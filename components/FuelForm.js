'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

const empty = {
  date: new Date().toISOString().split('T')[0],
  truck_no: '', driver_phone: '', driver_name: '',
  start_km: '', fuel_qty: '', end_km: '', filling_place: '',
  fuel_rate: '',
};

/* ── Autocomplete dropdown component ────────────────────────── */
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

export default function FuelForm({ id }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const [recentEntries, setRecentEntries] = useState([]);
  const isEdit = Boolean(id);

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [rentedVehicles, setRentedVehicles] = useState([]);
  const [fuelRates, setFuelRates] = useState([]);

  const [driverLocked, setDriverLocked] = useState(false);
  const [vehicleLocked, setVehicleLocked] = useState(false);
  const [placeLocked, setPlaceLocked] = useState(false);
  const [fuelRateLocked, setFuelRateLocked] = useState(false);

  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');

  const loadRecent = () => {
    fetch('/api/fuel-entries')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentEntries(data.slice(0, 10)); });
  };

  const loadMasters = () => {
    Promise.all([
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/filling-places').then(r => r.json()),
      fetch('/api/rented-vehicles').then(r => r.json()),
      fetch('/api/fuel-rates').then(r => r.json()),
    ]).then(([d, v, p, rv, fr]) => {
      if (Array.isArray(d)) setDrivers(d);
      if (Array.isArray(v)) setVehicles(v);
      if (Array.isArray(p)) setPlaces(p);
      if (Array.isArray(rv)) setRentedVehicles(rv);
      if (Array.isArray(fr)) setFuelRates(fr);
    });
  };

  useEffect(() => { loadRecent(); loadMasters(); }, []);

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/fuel-entries/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) { showToast(data.error, 'error'); return; }
          setForm({
            date: data.date, truck_no: data.truck_no, driver_phone: data.driver_phone,
            driver_name: data.driver_name, start_km: data.start_km, fuel_qty: data.fuel_qty,
            end_km: data.end_km, filling_place: data.filling_place,
            fuel_rate: data.fuel_rate || '',
          });
          setDriverSearch(data.driver_name);
          setVehicleSearch(data.truck_no);
          setPlaceSearch(data.filling_place);
          setDriverLocked(true); setVehicleLocked(true); setPlaceLocked(true);
        });
    }
  }, [id, isEdit]);

  const distance = form.start_km !== '' && form.end_km !== ''
    ? Math.max(0, Number(form.end_km) - Number(form.start_km)) : '';
  const mileage = distance !== '' && Number(form.fuel_qty) > 0
    ? (distance / Number(form.fuel_qty)).toFixed(2) : '';

  const isRented = rentedVehicles.some(rv => rv.number.toLowerCase() === form.truck_no.trim().toLowerCase());

  // Determine fuel type from vehicle or rented vehicle master data
  const selectedVehicleFuelType = (() => {
    const truckLower = form.truck_no.trim().toLowerCase();
    const v = vehicles.find(v => v.number.toLowerCase() === truckLower);
    if (v) return v.fuel_type || 'Diesel';
    const rv = rentedVehicles.find(rv => rv.number.toLowerCase() === truckLower);
    if (rv) return rv.fuel_type || 'Diesel';
    return '';
  })();

  // Auto-fill fuel rate from latest rate in master data based on vehicle's fuel type
  useEffect(() => {
    if (selectedVehicleFuelType && fuelRates.length > 0) {
      const matchingRate = fuelRates.find(r => (r.fuel_type || 'Diesel').toLowerCase() === selectedVehicleFuelType.toLowerCase());
      if (matchingRate) { setForm(prev => ({ ...prev, fuel_rate: String(matchingRate.rate) })); setFuelRateLocked(true); }
      else { setForm(prev => ({ ...prev, fuel_rate: '' })); setFuelRateLocked(false); }
    }
    if (!selectedVehicleFuelType) {
      setForm(prev => ({ ...prev, fuel_rate: '' })); setFuelRateLocked(false);
    }
  }, [selectedVehicleFuelType, fuelRates]); // eslint-disable-line

  const totalFuelCost = Number(form.fuel_qty) > 0 && Number(form.fuel_rate) > 0
    ? (Number(form.fuel_qty) * Number(form.fuel_rate)).toFixed(2) : '';

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); setSuccess(''); };

  const resetForm = () => {
    setForm(empty);
    setDriverSearch(''); setVehicleSearch(''); setPlaceSearch('');
    setDriverLocked(false); setVehicleLocked(false); setPlaceLocked(false); setFuelRateLocked(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const allVehicles = [...vehicles.map(v => v.number.toLowerCase()), ...rentedVehicles.map(rv => rv.number.toLowerCase())];
    if (!allVehicles.includes(form.truck_no.trim().toLowerCase())) { showToast('Truck No. must be selected from master data', 'error'); return; }
    if (!drivers.some(d => d.name.toLowerCase() === form.driver_name.trim().toLowerCase())) { showToast('Driver Name must be selected from master data', 'error'); return; }
    if (!places.some(p => p.name.toLowerCase() === form.filling_place.trim().toLowerCase())) { showToast('Place of Filling must be selected from master data', 'error'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const url = isEdit ? `/api/fuel-entries/${id}` : '/api/fuel-entries';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed', 'error'); return; }
      showToast(isEdit ? 'Entry updated successfully!' : 'Entry saved successfully!', 'success');
      if (!isEdit) resetForm();
      loadRecent();
    } finally { setLoading(false); }
  };

  const driverSuggestions = driverSearch && !driverLocked
    ? drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()))
        .map(d => ({ label: `${d.name} — ${d.phone}`, value: d }))
    : [];
  const vehicleSuggestions = vehicleSearch && !vehicleLocked
    ? [
        ...vehicles.filter(v => v.number.toLowerCase().includes(vehicleSearch.toLowerCase()))
          .map(v => ({ label: `${v.number} — ${v.fuel_type || 'Diesel'}`, value: v })),
        ...rentedVehicles.filter(rv => rv.number.toLowerCase().includes(vehicleSearch.toLowerCase()) && !vehicles.some(v => v.number.toLowerCase() === rv.number.toLowerCase()))
          .map(rv => ({ label: `${rv.number} — Rented (${rv.company})`, value: rv })),
      ]
    : [];
  const placeSuggestions = placeSearch && !placeLocked
    ? places.filter(p => p.name.toLowerCase().includes(placeSearch.toLowerCase()))
        .map(p => ({ label: p.name, value: p }))
    : [];

  return (
    <>
      <div className="topbar">
        <div className="page-title">{isEdit ? 'Edit Trip Entry' : 'New Trip Entry'}</div>
        <Link href="/entries" className="btn btn-secondary">📋 All Entries</Link>
      </div>

      <div className="content-area page-animate">
        <div className="page-head">
          <div>
            <div className="page-head-title">{isEdit ? 'Edit Trip Entry' : 'New Trip Entry'}</div>
            <div className="page-head-sub">Record fuel fill, mileage and trip details</div>
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
          {/* Section 1: Trip Information */}
          <div className="form-card">
            <div className="section-header">
              <div className="section-num">1</div>
              <div className="section-title">Trip Information</div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Trip Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required className="fc-input" />
              </div>
              <AutocompleteField
                label="Truck No." value={vehicleSearch} placeholder="e.g. MH-12-AB-1234" required
                readOnly={vehicleLocked}
                onChange={val => { const fmt = formatVehicleNumber(val); setVehicleSearch(fmt); setForm({ ...form, truck_no: fmt }); setSuccess(''); }}
                suggestions={vehicleSuggestions}
                onSelect={s => {
                  if (s === null) { setVehicleSearch(''); setVehicleLocked(false); setFuelRateLocked(false); setForm({ ...form, truck_no: '', fuel_rate: '' }); return; }
                  setVehicleSearch(s.value.number); setVehicleLocked(true);
                  setForm({ ...form, truck_no: s.value.number });
                }}
              />
              <AutocompleteField
                label="Place of Filling" value={placeSearch} placeholder="e.g. Mumbai HP Pump" required
                readOnly={placeLocked}
                onChange={val => { setPlaceSearch(val); setForm({ ...form, filling_place: val }); setSuccess(''); }}
                suggestions={placeSuggestions}
                onSelect={s => {
                  if (s === null) { setPlaceSearch(''); setPlaceLocked(false); setForm({ ...form, filling_place: '' }); return; }
                  setPlaceSearch(s.value.name); setPlaceLocked(true);
                  setForm({ ...form, filling_place: s.value.name });
                }}
              />
            </div>
          </div>

          {/* Section 2: Vehicle & Driver */}
          <div className="form-card">
            <div className="section-header">
              <div className="section-num">2</div>
              <div className="section-title">Vehicle & Driver</div>
            </div>
            <div className="form-grid">
              <AutocompleteField
                label="Driver Name" value={driverSearch} placeholder="Enter driver name" required
                readOnly={driverLocked}
                onChange={val => { setDriverSearch(val); setForm({ ...form, driver_name: val, driver_phone: '' }); setSuccess(''); }}
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
              <div className="form-group">
                <label>Fuel Quantity (Litres)</label>
                <div className="input-unit">
                  <input type="number" name="fuel_qty" value={form.fuel_qty} onChange={handleChange}
                    placeholder="0" step="0.01" required className="fc-input" />
                  <span className="unit-label">L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Odometer Details */}
          <div className="form-card">
            <div className="section-header">
              <div className="section-num">3</div>
              <div className="section-title">Odometer Details</div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Start Kilometer</label>
                <div className="input-unit">
                  <input type="number" name="start_km" value={form.start_km} onChange={handleChange}
                    placeholder="0" required className="fc-input" />
                  <span className="unit-label">km</span>
                </div>
              </div>
              <div className="form-group">
                <label>End Kilometer</label>
                <div className="input-unit">
                  <input type="number" name="end_km" value={form.end_km} onChange={handleChange}
                    placeholder="0" required className="fc-input" />
                  <span className="unit-label">km</span>
                </div>
              </div>
              <div className="form-group">
                <label>Distance (auto)</label>
                <input type="text" readOnly value={distance !== '' ? `${distance} km` : '—'} className="fc-input"
                  style={{ background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--muted)' }} />
              </div>
              {selectedVehicleFuelType && (
                <div className="form-group">
                  <label>Fuel Rate (₹/L) — {selectedVehicleFuelType}</label>
                  <div className="input-unit">
                    <input type="number" name="fuel_rate" value={form.fuel_rate} onChange={handleChange}
                      placeholder="0" step="0.01" className="fc-input" />
                    <span className="unit-label">₹</span>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-calculated preview */}
            <div className="cost-preview" style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div className="cost-preview-label">Distance Travelled</div>
                  <div className="cost-preview-value">{distance !== '' ? `${distance} km` : '—'}</div>
                </div>
                <div>
                  <div className="cost-preview-label">Mileage</div>
                  <div className="cost-preview-value">{mileage ? `${mileage} km/L` : '—'}</div>
                </div>
                <div>
                  <div className="cost-preview-label">Total Fuel Cost</div>
                  <div className="cost-preview-value">{totalFuelCost ? `₹ ${Number(totalFuelCost).toLocaleString()}` : '—'}</div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn btn-ghost">Clear</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : isEdit ? '✓ Update Entry' : '✓ Submit Entry'}
              </button>
            </div>
          </div>
        </form>
        </div>

        {/* Recent Entries */}
        {!isEdit && recentEntries.length > 0 && (
          <div className="split-right">
            <div className="table-card">
              <div className="table-head">
                <div className="table-title">Recent Entries</div>
                <Link href="/entries" className="view-all">VIEW ALL →</Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>VEHICLE</th>
                    <th>DRIVER</th>
                    <th style={{ textAlign: 'right' }}>FUEL (L)</th>
                    <th style={{ textAlign: 'right' }}>DISTANCE</th>
                    <th style={{ textAlign: 'right' }}>MILEAGE</th>
                    <th>PLACE</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>{entry.date}</td>
                      <td className="td-main">{entry.truck_no}</td>
                      <td>{entry.driver_name}</td>
                      <td style={{ textAlign: 'right' }}>{entry.fuel_qty} L</td>
                      <td style={{ textAlign: 'right' }}>{Number(entry.distance).toLocaleString()} km</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${entry.mileage >= 4 ? 'badge-green' : entry.mileage >= 2.5 ? 'badge-orange' : 'badge-red'}`}>
                          {entry.mileage} km/L
                        </span>
                      </td>
                      <td>{entry.filling_place}</td>
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
