'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

/* ── Formatters ── */
const titleCase = (str) => str.replace(/\b\w/g, c => c.toUpperCase()).replace(/(?<=\b\w)\w*/g, m => m.toLowerCase());

const formatVehicleNumber = (raw) => {
  const v = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  // Auto-insert dashes: XX-00-XX(X)-0000
  let result = '';
  let i = 0;
  // Part 1: letters (state code)
  while (i < v.length && /[A-Z]/.test(v[i])) { result += v[i++]; }
  if (i < v.length) { result += '-'; }
  // Part 2: digits (district)
  while (i < v.length && /[0-9]/.test(v[i])) { result += v[i++]; }
  if (i < v.length) { result += '-'; }
  // Part 3: letters (series)
  while (i < v.length && /[A-Z]/.test(v[i])) { result += v[i++]; }
  if (i < v.length) { result += '-'; }
  // Part 4: digits (number)
  while (i < v.length && /[0-9]/.test(v[i])) { result += v[i++]; }
  return result;
};

const phoneOnly = (str) => str.replace(/[^0-9]/g, '').slice(0, 10);

function MasterSection({ title, icon, items, fields, apiUrl, onReload }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  const suggestRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
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

  const cancel = () => { setAdding(false); setEditId(null); setFocusedField(null); };

  const handleSave = async () => {
    // Validate all fields required (skip checkbox, select, and conditionally hidden fields)
    const visibleFields = fields.filter(f => f.type !== 'checkbox' && f.type !== 'select' && (!f.showWhen || form[f.showWhen]));
    const emptyField = visibleFields.find(f => !form[f.name] || !String(form[f.name]).trim());
    if (emptyField) { showToast(`${emptyField.placeholder} is required`, 'error'); return; }
    // Validate phone fields (10 digits)
    const phoneField = fields.find(f => f.inputMode === 'numeric');
    if (phoneField && form[phoneField.name].length !== 10) { showToast('Phone number must be 10 digits', 'error'); return; }
    // Validate suggestion fields match master data
    const badSuggest = fields.find(f => f.suggestions && !f.suggestions.some(s => s.toLowerCase() === String(form[f.name]).trim().toLowerCase()));
    if (badSuggest) { showToast(`${badSuggest.placeholder} must be selected from existing master data`, 'error'); return; }
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
              {fields.map(f => {
                if (f.showWhen && !form[f.showWhen]) return null;
                return (
                <div key={f.name} style={{ flex: f.type === 'checkbox' ? 'none' : 1, position: 'relative', display: 'flex', alignItems: f.type === 'checkbox' ? 'center' : undefined, gap: f.type === 'checkbox' ? 4 : undefined }}>
                  {f.type === 'checkbox' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={!!form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.checked ? 1 : 0 })} />
                      {f.placeholder}
                    </label>
                  ) : f.type === 'select' ? (
                    <select value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      className="fc-input" style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}>
                      <option value="">{f.placeholder}</option>
                      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <>
                      <input type={f.type || 'text'} placeholder={f.placeholder} value={form[f.name] || ''}
                        inputMode={f.inputMode || undefined}
                        maxLength={f.maxLength || undefined}
                        required
                        onFocus={() => f.suggestions && setFocusedField(f.name)}
                        onBlur={() => setTimeout(() => setFocusedField(null), 150)}
                        onChange={e => {
                          let val = e.target.value;
                          if (f.transform) val = f.transform(val);
                          setForm({ ...form, [f.name]: val });
                          if (f.suggestions) setFocusedField(f.name);
                        }}
                        className="fc-input" style={{ width: '100%', padding: '6px 10px', fontSize: 12 }} />
                      {f.suggestions && focusedField === f.name && (() => {
                        const filtered = f.suggestions.filter(s => s.toLowerCase().includes((form[f.name] || '').toLowerCase()));
                        return filtered.length > 0 ? (
                          <div className="autocomplete-list" ref={suggestRef}>
                            {filtered.map(s => (
                              <div key={s} className="autocomplete-item" onMouseDown={() => { setForm({ ...form, [f.name]: s }); setFocusedField(null); }}>{s}</div>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              );})}
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
                  {fields.map(f => {
                    if (f.showWhen && !form[f.showWhen]) return null;
                    return (
                    <div key={f.name} style={{ flex: f.type === 'checkbox' ? 'none' : 1, position: 'relative', display: 'flex', alignItems: f.type === 'checkbox' ? 'center' : undefined, gap: f.type === 'checkbox' ? 4 : undefined }}>
                      {f.type === 'checkbox' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input type="checkbox" checked={!!form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.checked ? 1 : 0 })} />
                          {f.placeholder}
                        </label>
                      ) : f.type === 'select' ? (
                        <select value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                          className="fc-input" style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}>
                          <option value="">{f.placeholder}</option>
                          {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <>
                          <input type={f.type || 'text'} value={form[f.name] || ''}
                            inputMode={f.inputMode || undefined}
                            maxLength={f.maxLength || undefined}
                            required
                            placeholder={f.placeholder}
                            onFocus={() => f.suggestions && setFocusedField(f.name)}
                            onBlur={() => setTimeout(() => setFocusedField(null), 150)}
                            onChange={e => {
                              let val = e.target.value;
                              if (f.transform) val = f.transform(val);
                              setForm({ ...form, [f.name]: val });
                              if (f.suggestions) setFocusedField(f.name);
                            }}
                            className="fc-input" style={{ width: '100%', padding: '6px 10px', fontSize: 12 }} />
                          {f.suggestions && focusedField === f.name && (() => {
                            const filtered = f.suggestions.filter(s => s.toLowerCase().includes((form[f.name] || '').toLowerCase()));
                            return filtered.length > 0 ? (
                              <div className="autocomplete-list" ref={suggestRef}>
                                {filtered.map(s => (
                                  <div key={s} className="autocomplete-item" onMouseDown={() => { setForm({ ...form, [f.name]: s }); setFocusedField(null); }}>{s}</div>
                                ))}
                              </div>
                            ) : null;
                          })()}
                        </>
                      )}
                    </div>
                  );})}
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
                    {fields.some(f => f.type === 'checkbox' && item[f.name]) && (
                      <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(245,166,35,0.15)', color: '#f5a623', padding: '1px 6px', borderRadius: 4 }}>MRU</span>
                    )}
                  </div>
                  <div className="master-item-sub">
                    {fields.filter(f => !f.bold && f.type !== 'checkbox' && (!f.showWhen || item[f.showWhen])).map(f => f.format ? f.format(item[f.name]) : item[f.name]).filter(Boolean).join(' • ')}
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
  const [companies, setCompanies] = useState([]);
  const [residualFuel, setResidualFuel] = useState([]);
  const [rentedVehicles, setRentedVehicles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [d, v, p, fr, c, rf, rv, st, pr] = await Promise.all([
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/filling-places').then(r => r.json()),
      fetch('/api/fuel-rates').then(r => r.json()),
      fetch('/api/companies').then(r => r.json()),
      fetch('/api/residual-fuel').then(r => r.json()),
      fetch('/api/rented-vehicles').then(r => r.json()),
      fetch('/api/staff').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]);
    if (Array.isArray(d)) setDrivers(d);
    if (Array.isArray(v)) setVehicles(v);
    if (Array.isArray(p)) setPlaces(p);
    if (Array.isArray(fr)) setFuelRates(fr);
    if (Array.isArray(c)) setCompanies(c);
    if (Array.isArray(rf)) setResidualFuel(rf);
    if (Array.isArray(rv)) setRentedVehicles(rv);
    if (Array.isArray(st)) setStaff(st);
    if (Array.isArray(pr)) setProducts(pr);
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
                { name: 'name', placeholder: 'Driver name', bold: true, transform: titleCase },
                { name: 'phone', placeholder: 'Phone number', inputMode: 'numeric', maxLength: 10, transform: phoneOnly },
                { name: 'company', placeholder: 'Company name', suggestions: companies.map(c => c.name), transform: titleCase },
              ]}
            />
            <MasterSection
              title="Vehicles" icon="🚛" items={vehicles} apiUrl="/api/vehicles" onReload={loadAll}
              fields={[
                { name: 'number', placeholder: 'e.g. GJ-30-HJ-0728', bold: true, transform: formatVehicleNumber },
                { name: 'brand', placeholder: 'Brand name', transform: titleCase },
                { name: 'company', placeholder: 'Company name', suggestions: companies.map(c => c.name), transform: titleCase },
              ]}
            />
            <MasterSection
              title="Filling Places" icon="⛽" items={places} apiUrl="/api/filling-places" onReload={loadAll}
              fields={[
                { name: 'name', placeholder: 'Place name', bold: true, transform: titleCase },
                { name: 'is_mru', placeholder: 'Mobile Refueling Unit', type: 'checkbox' },
                { name: 'associate_vehicle', placeholder: 'Associate Vehicle', type: 'select', options: vehicles.map(v => v.number), showWhen: 'is_mru' },
              ]}
            />
            <MasterSection
              title="Companies" icon="🏢" items={companies} apiUrl="/api/companies" onReload={loadAll}
              fields={[
                { name: 'name', placeholder: 'Company name', bold: true, transform: titleCase },
                { name: 'location', placeholder: 'Location', transform: titleCase },
              ]}
            />
            <MasterSection
              title="Products" icon="📦" items={products} apiUrl="/api/products" onReload={loadAll}
              fields={[
                { name: 'name', placeholder: 'Product name', bold: true, transform: titleCase },
              ]}
            />
            <MasterSection
              title="Product Rates" icon="💰" items={fuelRates} apiUrl="/api/fuel-rates" onReload={loadAll}
              fields={[
                { name: 'fuel_type', placeholder: 'Product', bold: true, type: 'select', options: products.map(p => p.name), defaultValue: '' },
                { name: 'date', placeholder: 'Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0], format: d => { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; } },
                { name: 'rate', placeholder: 'Rate per litre' },
              ]}
            />
            <MasterSection
              title="Rented Vehicles" icon="🔑" items={rentedVehicles} apiUrl="/api/rented-vehicles" onReload={loadAll}
              fields={[
                { name: 'number', placeholder: 'e.g. GJ-30-HJ-0728', bold: true, transform: formatVehicleNumber },
                { name: 'company', placeholder: 'Company name', suggestions: companies.map(c => c.name), transform: titleCase },
              ]}
            />
            <MasterSection
              title="Staff" icon="🧑‍💼" items={staff} apiUrl="/api/staff" onReload={loadAll}
              fields={[
                { name: 'name', placeholder: 'Staff name', bold: true, transform: titleCase },
                { name: 'vehicle_number', placeholder: 'Vehicle number', transform: formatVehicleNumber },
                { name: 'fuel_type', placeholder: 'Fuel Type', type: 'select', options: products.map(p => p.name), defaultValue: '' },
              ]}
            />
            <MasterSection
              title="Residual Fuel" icon="🛢️" items={residualFuel} apiUrl="/api/residual-fuel" onReload={loadAll}
              fields={[
                { name: 'date', placeholder: 'Date', bold: true, type: 'date', defaultValue: new Date().toISOString().split('T')[0], format: d => { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; } },
                { name: 'opening_balance', placeholder: 'Opening Balance (L)' },
                { name: 'filling_place', placeholder: 'Fuel Station', suggestions: places.filter(p => p.is_mru).map(p => p.name) },
              ]}
            />
          </div>
        )}
      </div>
    </>
  );
}
