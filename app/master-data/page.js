'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Users, Truck, MapPin } from 'lucide-react';

function MasterSection({ title, icon: Icon, items, fields, apiUrl, onReload }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const startAdd = () => {
    const empty = {};
    fields.forEach(f => { empty[f.name] = ''; });
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <button onClick={startAdd} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {error && <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="divide-y divide-gray-100">
        {/* Add row */}
        {adding && (
          <div className="flex items-center gap-2 px-5 py-3 bg-blue-50">
            {fields.map(f => (
              <input key={f.name} type="text" placeholder={f.placeholder} value={form[f.name] || ''}
                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            ))}
            <button onClick={handleSave} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="h-4 w-4" /></button>
            <button onClick={cancel} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
          </div>
        )}

        {items.length === 0 && !adding && (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No items yet. Click Add to create one.</div>
        )}

        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 px-5 py-3 hover:bg-gray-50">
            {editId === item.id ? (
              <>
                {fields.map(f => (
                  <input key={f.name} type="text" value={form[f.name] || ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                ))}
                <button onClick={handleSave} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="h-4 w-4" /></button>
                <button onClick={cancel} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center gap-3">
                  {fields.map(f => (
                    <span key={f.name} className={`text-sm ${f.bold ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{item[f.name]}</span>
                  ))}
                </div>
                <button onClick={() => startEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
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
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [d, v, p] = await Promise.all([
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/filling-places').then(r => r.json()),
    ]);
    if (Array.isArray(d)) setDrivers(d);
    if (Array.isArray(v)) setVehicles(v);
    if (Array.isArray(p)) setPlaces(p);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]); // eslint-disable-line

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-6">
          <MasterSection
            title="Drivers" icon={Users} items={drivers} apiUrl="/api/drivers" onReload={loadAll}
            fields={[
              { name: 'name', placeholder: 'Driver name', bold: true },
              { name: 'phone', placeholder: 'Phone number' },
            ]}
          />
          <MasterSection
            title="Vehicles" icon={Truck} items={vehicles} apiUrl="/api/vehicles" onReload={loadAll}
            fields={[
              { name: 'number', placeholder: 'Vehicle number (e.g. MH-12-AB-1234)', bold: true },
              { name: 'brand', placeholder: 'Brand name' },
            ]}
          />
          <MasterSection
            title="Filling Places" icon={MapPin} items={places} apiUrl="/api/filling-places" onReload={loadAll}
            fields={[
              { name: 'name', placeholder: 'Place name (e.g. Mumbai HP Pump)', bold: true },
            ]}
          />
        </div>
      )}
    </div>
  );
}
