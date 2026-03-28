'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';

const empty = {
  date: new Date().toISOString().split('T')[0],
  truck_no: '', driver_phone: '', driver_name: '',
  start_km: '', fuel_qty: '', end_km: '', filling_place: '',
};

export default function FuelForm({ id }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(id);

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
        });
    }
  }, [id, isEdit]);

  const distance = form.start_km !== '' && form.end_km !== ''
    ? Math.max(0, Number(form.end_km) - Number(form.start_km)) : '';
  const mileage = distance !== '' && Number(form.fuel_qty) > 0
    ? (distance / Number(form.fuel_qty)).toFixed(2) : '';

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = isEdit ? `/api/fuel-entries/${id}` : '/api/fuel-entries';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      router.push('/entries');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'date',         label: 'Date of Filling',       type: 'date' },
    { name: 'truck_no',     label: 'Truck No.',              type: 'text',   placeholder: 'e.g. MH-12-AB-1234' },
    { name: 'driver_name',  label: 'Driver Name',            type: 'text',   placeholder: 'Enter driver name' },
    { name: 'driver_phone', label: 'Driver Phone No.',       type: 'tel',    placeholder: 'e.g. 9876543210' },
    { name: 'start_km',     label: 'Start Kilometer',        type: 'number', placeholder: '0' },
    { name: 'end_km',       label: 'End Kilometer',          type: 'number', placeholder: '0' },
    { name: 'fuel_qty',     label: 'Fuel Quantity (Litres)', type: 'number', placeholder: '0', step: '0.01' },
    { name: 'filling_place',label: 'Place of Filling',       type: 'text',   placeholder: 'e.g. Mumbai HP Pump' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Fuel Entry' : 'Add Fuel Entry'}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                placeholder={f.placeholder} step={f.step} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          ))}
        </div>

        {/* Auto-calculated preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Distance Travelled (km)</p>
            <p className="text-2xl font-bold text-blue-900">{distance !== '' ? distance : '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Mileage (km/L)</p>
            <p className="text-2xl font-bold text-blue-900">{mileage || '—'}</p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
