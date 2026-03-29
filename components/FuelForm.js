'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Eye, X } from 'lucide-react';

const empty = {
  date: new Date().toISOString().split('T')[0],
  truck_no: '', driver_phone: '', driver_name: '',
  start_km: '', fuel_qty: '', end_km: '', filling_place: '',
};

/* ── Autocomplete dropdown component ────────────────────────── */
function AutocompleteField({ label, value, onChange, onSelect, suggestions, placeholder, required, readOnly }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="flex">
        <input
          type="text" value={value} placeholder={placeholder} required={required} readOnly={readOnly}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => !readOnly && setOpen(true)}
          className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-colors ${readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-300'}`}
        />
        {value && !readOnly && (
          <button type="button" onClick={() => { onSelect(null); setOpen(false); }} className="ml-1 p-1.5 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => { onSelect(s); setOpen(false); }}
              className="px-3.5 py-2.5 hover:bg-blue-50 cursor-pointer text-sm first:rounded-t-xl last:rounded-b-xl">{s.label}</li>
          ))}
        </ul>
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
  const [recentEntries, setRecentEntries] = useState([]);
  const isEdit = Boolean(id);

  // Master data lists
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [places, setPlaces] = useState([]);

  // Track whether fields are locked via master selection
  const [driverLocked, setDriverLocked] = useState(false);
  const [vehicleLocked, setVehicleLocked] = useState(false);
  const [placeLocked, setPlaceLocked] = useState(false);

  // Typed search text (when not locked)
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
    ]).then(([d, v, p]) => {
      if (Array.isArray(d)) setDrivers(d);
      if (Array.isArray(v)) setVehicles(v);
      if (Array.isArray(p)) setPlaces(p);
    });
  };

  useEffect(() => { loadRecent(); loadMasters(); }, []);

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/fuel-entries/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) { setError(data.error); return; }
          setForm({
            date: data.date, truck_no: data.truck_no, driver_phone: data.driver_phone,
            driver_name: data.driver_name, start_km: data.start_km, fuel_qty: data.fuel_qty,
            end_km: data.end_km, filling_place: data.filling_place,
          });
          setDriverSearch(data.driver_name);
          setVehicleSearch(data.truck_no);
          setPlaceSearch(data.filling_place);
          setDriverLocked(true);
          setVehicleLocked(true);
          setPlaceLocked(true);
        });
    }
  }, [id, isEdit]);

  const distance = form.start_km !== '' && form.end_km !== ''
    ? Math.max(0, Number(form.end_km) - Number(form.start_km)) : '';
  const mileage = distance !== '' && Number(form.fuel_qty) > 0
    ? (distance / Number(form.fuel_qty)).toFixed(2) : '';

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); setSuccess(''); };

  const resetForm = () => {
    setForm(empty);
    setDriverSearch(''); setVehicleSearch(''); setPlaceSearch('');
    setDriverLocked(false); setVehicleLocked(false); setPlaceLocked(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const url = isEdit ? `/api/fuel-entries/${id}` : '/api/fuel-entries';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setSuccess(isEdit ? 'Entry updated successfully!' : 'Entry saved successfully!');
      if (!isEdit) resetForm();
      loadRecent();
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered suggestion builders ──
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Fuel Entry' : 'Add Fuel Entry'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Update the entry details' : 'Record a new fuel filling'}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Filling</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm hover:border-gray-300 transition-colors" />
          </div>

          {/* Vehicle (autocomplete) */}
          <AutocompleteField
            label="Truck No." value={vehicleSearch} placeholder="e.g. MH-12-AB-1234" required
            readOnly={vehicleLocked}
            onChange={val => { setVehicleSearch(val); setForm({ ...form, truck_no: val }); setSuccess(''); }}
            suggestions={vehicleSuggestions}
            onSelect={s => {
              if (s === null) { setVehicleSearch(''); setVehicleLocked(false); setForm({ ...form, truck_no: '' }); return; }
              setVehicleSearch(s.value.number);
              setVehicleLocked(true);
              setForm({ ...form, truck_no: s.value.number });
            }}
          />

          {/* Driver Name (autocomplete) */}
          <AutocompleteField
            label="Driver Name" value={driverSearch} placeholder="Enter driver name" required
            readOnly={driverLocked}
            onChange={val => { setDriverSearch(val); setForm({ ...form, driver_name: val, driver_phone: '' }); setSuccess(''); }}
            suggestions={driverSuggestions}
            onSelect={s => {
              if (s === null) { setDriverSearch(''); setDriverLocked(false); setForm({ ...form, driver_name: '', driver_phone: '' }); return; }
              setDriverSearch(s.value.name);
              setDriverLocked(true);
              setForm({ ...form, driver_name: s.value.name, driver_phone: s.value.phone });
            }}
          />

          {/* Driver Phone (auto-filled, read-only when driver selected) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver Phone No.</label>
            <input type="tel" name="driver_phone" value={form.driver_phone} placeholder="e.g. 9876543210"
              onChange={handleChange} required readOnly={driverLocked}
              className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-colors ${driverLocked ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300'}`} />
          </div>

          {/* Start KM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Kilometer</label>
            <input type="number" name="start_km" value={form.start_km} onChange={handleChange} placeholder="0" required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm hover:border-gray-300 transition-colors" />
          </div>

          {/* End KM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Kilometer</label>
            <input type="number" name="end_km" value={form.end_km} onChange={handleChange} placeholder="0" required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm hover:border-gray-300 transition-colors" />
          </div>

          {/* Fuel Qty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel Quantity (Litres)</label>
            <input type="number" name="fuel_qty" value={form.fuel_qty} onChange={handleChange} placeholder="0" step="0.01" required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm hover:border-gray-300 transition-colors" />
          </div>

          {/* Filling Place (autocomplete) */}
          <AutocompleteField
            label="Place of Filling" value={placeSearch} placeholder="e.g. Mumbai HP Pump" required
            readOnly={placeLocked}
            onChange={val => { setPlaceSearch(val); setForm({ ...form, filling_place: val }); setSuccess(''); }}
            suggestions={placeSuggestions}
            onSelect={s => {
              if (s === null) { setPlaceSearch(''); setPlaceLocked(false); setForm({ ...form, filling_place: '' }); return; }
              setPlaceSearch(s.value.name);
              setPlaceLocked(true);
              setForm({ ...form, filling_place: s.value.name });
            }}
          />
        </div>

        {/* Auto-calculated preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Distance Travelled (km)</p>
            <p className="text-3xl font-bold text-blue-900">{distance !== '' ? distance : '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Mileage (km/L)</p>
            <p className="text-3xl font-bold text-blue-900">{mileage || '—'}</p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Save Entry'}
        </button>
      </form>

      {/* Recent Entries */}
      {!isEdit && recentEntries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Entries</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-gray-500">Truck No.</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-gray-500">Driver</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide text-gray-500">Fuel (L)</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide text-gray-500">Distance</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide text-gray-500">Mileage</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-gray-500">Place</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry, i) => (
                    <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">{entry.date}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{entry.truck_no}</td>
                      <td className="px-4 py-3">{entry.driver_name}</td>
                      <td className="px-4 py-3 text-right">{entry.fuel_qty} L</td>
                      <td className="px-4 py-3 text-right">{Number(entry.distance).toLocaleString()} km</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${entry.mileage >= 4 ? 'bg-emerald-50 text-emerald-700' : entry.mileage >= 2.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {entry.mileage} km/L
                        </span>
                      </td>
                      <td className="px-4 py-3">{entry.filling_place}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Link href="/entries" className="mt-3 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm border border-gray-100">
            <Eye className="h-4 w-4" /> View All Entries
          </Link>
        </div>
      )}
    </div>
  );
}
