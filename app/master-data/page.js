'use client';
import { useState, useEffect, useCallback } from 'react';

function MasterSection({ title, icon, items, fields, apiUrl, onReload }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 1000);
  };

  const startAdd = () => {
    const empty = {};
    fields.forEach(f => { empty[f.name] = f.defaultValue || ''; });
    setForm(empty);
    setAdding(true);
    setEditId(null);
  };

  const startEdit = (item) => {
    const data = {};
    fields.forEach(f => { data[f.name] = item[f.name] || ''; });
    setForm(data);
    setEditId(item.id);
    setAdding(false);
  };

  const cancel = () => { setAdding(false); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editId ? `${apiUrl}/${editId}` : apiUrl;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed', 'error'); return; }
      showToast(editId ? 'Updated successfully!' : 'Added successfully!', 'success');
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
    <div className="master-card">
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
      <div className="master-card-head">
        <div className="master-card-title">
          <span className="master-icon">{icon}</span> {title}
        </div>
        <span className="master-count">{items.length} records</span>
      </div>

      <div className="master-list">
        {/* Add row */}
        {adding && (
          <div className="master-item" style={{ background: 'rgba(245,166,35,0.05)' }}>
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              {fields.map(f => (
                <input key={f.name} type={f.type || 'text'} placeholder={f.placeholder} value={form[f.name] || ''}
                  onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                  className="fc-input" style={{ flex: 1, padding: '6px 10px', fontSize: 12 }} />
              ))}
            </div>
            <div className="master-actions">
              <button onClick={handleSave} disabled={saving} className="icon-btn" style={{ color: 'var(--green)' }}>✓</button>
              <button onClick={cancel} className="icon-btn">✕</button>
            </div>
          </div>
        )}

        {items.length === 0 && !adding && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>No items yet</div>
        )}

        {items.map(item => (
          <div key={item.id} className="master-item">
            {editId === item.id ? (
              <>
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  {fields.map(f => (
                    <input key={f.name} type={f.type || 'text'} value={form[f.name] || ''}
                      onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      className="fc-input" style={{ flex: 1, padding: '6px 10px', fontSize: 12 }} />
                  ))}
                </div>
                <div className="master-actions">
                  <button onClick={handleSave} disabled={saving} className="icon-btn" style={{ color: 'var(--green)' }}>✓</button>
                  <button onClick={cancel} className="icon-btn">✕</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="master-item-name">
                    {fields.map(f => f.bold ? (f.format ? f.format(item[f.name]) : item[f.name]) : null).filter(Boolean).join(' ')}
                  </div>
                  <div className="master-item-sub">
                    {fields.filter(f => !f.bold).map(f => f.format ? f.format(item[f.name]) : item[f.name]).filter(Boolean).join(' • ')}
                  </div>
                </div>
                <div className="master-actions">
                  <button onClick={() => startEdit(item)} className="icon-btn">✏️</button>
                  <button onClick={() => handleDelete(item.id)} className="icon-btn">🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="master-add" onClick={startAdd}>+ Add {title.replace(/s$/, '')}</div>
    </div>
  );
}

export default function MasterDataPage() {
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

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <>
      <div className="topbar">
        <div className="page-title">Master Data</div>
      </div>

      <div className="content-area page-animate">
        <div className="page-head">
          <div>
            <div className="page-head-title">Master Data</div>
            <div className="page-head-sub">Manage reference data used across the system</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="master-grid">
            <MasterSection
              title="Drivers" icon="👤" items={drivers} apiUrl="/api/drivers" onReload={loadAll}
              fields={[
                { name: 'name', placeholder: 'Driver name', bold: true },
                { name: 'phone', placeholder: 'Phone number' },
                { name: 'company', placeholder: 'Company name' },
              ]}
            />
            <MasterSection
              title="Vehicles" icon="🚛" items={vehicles} apiUrl="/api/vehicles" onReload={loadAll}
              fields={[
                { name: 'number', placeholder: 'Vehicle number', bold: true },
                { name: 'brand', placeholder: 'Brand name' },
                { name: 'company', placeholder: 'Company name' },
              ]}
            />
            <MasterSection
              title="Filling Places" icon="⛽" items={places} apiUrl="/api/filling-places" onReload={loadAll}
              fields={[
                { name: 'name', placeholder: 'Place name', bold: true },
              ]}
            />
            <MasterSection
              title="Fuel Rates" icon="💰" items={fuelRates} apiUrl="/api/fuel-rates" onReload={loadAll}
              fields={[
                { name: 'date', placeholder: 'Date', bold: true, type: 'date', defaultValue: new Date().toISOString().split('T')[0], format: d => { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; } },
                { name: 'rate', placeholder: 'Rate per litre' },
              ]}
            />
          </div>
        )}
      </div>
    </>
  );
}
