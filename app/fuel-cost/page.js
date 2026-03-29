'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, X, Pencil, Trash2, Search } from 'lucide-react';

/* ── Autocomplete dropdown ────────────────────────────────── */
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex">
        <input
          type="text" value={value} placeholder={placeholder} required={required} readOnly={readOnly}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => !readOnly && setOpen(true)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {value && !readOnly && (
          <button type="button" onClick={() => { onSelect(null); setOpen(false); }} className="ml-1 p-1.5 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => { onSelect(s); setOpen(false); }}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">{s.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FuelCostPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  // Form state
  const [form, setForm] = useState({ date: today, truck_no: '', driver_name: '', fuel_qty: '', fuel_rate: '', filling_place: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit mode
  const [editId, setEditId] = useState(null);

  // Master data
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [fuelRates, setFuelRates] = useState([]);

  // Entries list
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Lock states
  const [driverLocked, setDriverLocked] = useState(false);
  const [vehicleLocked, setVehicleLocked] = useState(false);
  const [placeLocked, setPlaceLocked] = useState(false);

  // Search text
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');

  // Filter state
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

  // Auto-fill fuel rate: find the latest rate on or before the selected date
  useEffect(() => {
    if (!form.date || editId) return;
    // fuelRates are sorted by date DESC from API
    const match = fuelRates.find(r => r.date <= form.date);
    if (match) {
      setForm(prev => ({ ...prev, fuel_rate: match.rate }));
    } else {
      setForm(prev => ({ ...prev, fuel_rate: '' }));
    }
  }, [form.date, fuelRates, editId]);

  const hasRateForDate = fuelRates.some(r => r.date <= form.date);

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
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const url = editId ? `/api/fuel-cost-entries/${editId}` : '/api/fuel-cost-entries';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setSuccess(editId ? 'Entry updated!' : 'Entry saved!');
      resetForm();
      loadEntries();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/fuel-cost-entries/${id}`, { method: 'DELETE' });
    loadEntries();
  };

  // Suggestion builders
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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Creditor Record' : 'Creditor Records'}</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      {/* ── FORM ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>

          {/* Truck No */}
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

          {/* Driver Name */}
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

          {/* Fuel Qty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Qty (Litres)</label>
            <input type="number" name="fuel_qty" value={form.fuel_qty} onChange={handleChange} placeholder="0" step="0.01" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>

          {/* Fuel Rate (always auto-filled from master, uneditable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Rate (₹/L)
              {hasRateForDate && <span className="ml-2 text-xs text-green-600 font-normal">from master data</span>}
            </label>
            <input type="number" name="fuel_rate" value={form.fuel_rate}
              placeholder="0.00" step="0.01" required readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm bg-gray-100 cursor-not-allowed" />
            {!hasRateForDate && form.date && (
              <p className="mt-1 text-xs text-amber-600">No rate found. Please add a fuel rate in Master Data first.</p>
            )}
          </div>

          {/* Place of Filling */}
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
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-700 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-blue-900">{cost ? `₹ ${Number(cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : editId ? 'Update Entry' : 'Save Entry'}
          </button>
          {editId && (
            <button type="button" onClick={resetForm}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ── ENTRIES TABLE ─────────────────────────────────── */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Creditor Records</h2>

      <form onSubmit={e => { e.preventDefault(); loadEntries(); }} className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Filter by Truck No." value={filterTruck}
          onChange={e => setFilterTruck(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <input type="text" placeholder="Filter by Driver" value={filterDriver}
          onChange={e => setFilterDriver(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <button type="submit" className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
          <Search className="h-4 w-4" /> Search
        </button>
      </form>

      {entriesLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No fuel cost entries yet.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Date', 'Truck No.', 'Driver', 'Fuel (L)', 'Rate (₹)', 'Cost (₹)', 'Place', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 ${['Fuel (L)', 'Rate (₹)', 'Cost (₹)'].includes(h) ? 'text-right' : h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">{entry.date}</td>
                    <td className="px-4 py-3 font-medium">{entry.truck_no}</td>
                    <td className="px-4 py-3">{entry.driver_name}</td>
                    <td className="px-4 py-3 text-right">{entry.fuel_qty} L</td>
                    <td className="px-4 py-3 text-right">₹{Number(entry.fuel_rate).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(entry.cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">{entry.filling_place}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(entry)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
