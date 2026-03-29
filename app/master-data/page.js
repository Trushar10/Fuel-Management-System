'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Users, Truck, MapPin, IndianRupee } from 'lucide-react';

function MasterSection({ title, icon: Icon, items, fields, apiUrl, onReload }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const startAdd = () => {
    const empty = {};
    fields.forEach(f => { empty[f.name] = f.defaultValue || ''; });
    setForm(empty);
    setAdding(true);
    setEditId(null);
    setError('');
  };

  const startEdit = (item) => {
    const data = {};
    fields.forEach(f => { data[f.name] = item[f.name] || ''; });
    setForm(data);
    setEditId(item.id);
    setAdding(false);
    setError('');
  };

  const cancel = () => { setAdding(false); setEditId(null); setError(''); };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const url = editId ? `${apiUrl}/${editId}` : apiUrl;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      cancel();
      onReload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
    onReload();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{items.length}</span>
        </div>
        <button onClick={startAdd} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {error && <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      <div className="divide-y divide-gray-50">
        {/* Add row */}
        {adding && (
          <div className="flex items-center gap-2 px-5 py-3.5 bg-blue-50/50">
            {fields.map(f => (
              <input key={f.name} type={f.type || 'text'} placeholder={f.placeholder} value={form[f.name] || ''}
                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            ))}
            <button onClick={handleSave} disabled={saving} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"><Check className="h-4 w-4" /></button>
            <button onClick={cancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"><X className="h-4 w-4" /></button>
          </div>
        )}

        {items.length === 0 && !adding && (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No items yet. Click Add to create one.</div>
        )}

        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            {editId === item.id ? (
              <>
                {fields.map(f => (
                  <input key={f.name} type={f.type || 'text'} value={form[f.name] || ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                ))}
                <button onClick={handleSave} disabled={saving} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"><Check className="h-4 w-4" /></button>
                <button onClick={cancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center gap-3">
                  {fields.map(f => (
                    <span key={f.name} className={`text-sm ${f.bold ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{f.format ? f.format(item[f.name]) : item[f.name]}</span>
                  ))}
                </div>
                <button onClick={() => startEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [fuelRates, setFuelRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [d, v, p, fr] = await Promise.all([
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/filling-places').then(r => r.json()),
      fetch('/api/fuel-rates').then(r => r.json()),
    ]);
    if (Array.isArray(d)) setDrivers(d);
    if (Array.isArray(v)) setVehicles(v);
    if (Array.isArray(p)) setPlaces(p);
    if (Array.isArray(fr)) setFuelRates(fr);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]); // eslint-disable-line

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage drivers, vehicles, places & rates</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <MasterSection
            title="Drivers" icon={Users} items={drivers} apiUrl="/api/drivers" onReload={loadAll}
            fields={[
              { name: 'name', placeholder: 'Driver name', bold: true },
              { name: 'phone', placeholder: 'Phone number' },
              { name: 'company', placeholder: 'Company name' },
            ]}
          />
          <MasterSection
            title="Vehicles" icon={Truck} items={vehicles} apiUrl="/api/vehicles" onReload={loadAll}
            fields={[
              { name: 'number', placeholder: 'Vehicle number (e.g. MH-12-AB-1234)', bold: true },
              { name: 'brand', placeholder: 'Brand name' },
              { name: 'company', placeholder: 'Company name' },
            ]}
          />
          <MasterSection
            title="Filling Places" icon={MapPin} items={places} apiUrl="/api/filling-places" onReload={loadAll}
            fields={[
              { name: 'name', placeholder: 'Place name (e.g. Mumbai HP Pump)', bold: true },
            ]}
          />
          <MasterSection
            title="Fuel Rates" icon={IndianRupee} items={fuelRates} apiUrl="/api/fuel-rates" onReload={loadAll}
            fields={[
              { name: 'date', placeholder: 'Date', bold: true, type: 'date', defaultValue: new Date().toISOString().split('T')[0], format: d => { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; } },
              { name: 'rate', placeholder: 'Rate per litre (e.g. 89.50)' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
