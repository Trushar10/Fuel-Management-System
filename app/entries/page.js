'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Search, PlusCircle, Table2, X } from 'lucide-react';

function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTruck, setSearchTruck] = useState('');
  const [searchDriver, setSearchDriver] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTruck) params.set('truck_no', searchTruck);
    if (searchDriver) params.set('driver_name', searchDriver);
    const res = await fetch(`/api/fuel-entries?${params}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/fuel-entries/${id}`, { method: 'DELETE' });
    setEntries(entries.filter(e => e.id !== id));
  };

  const clearFilters = () => {
    setSearchTruck('');
    setSearchDriver('');
  };

  const hasFilters = searchTruck || searchDriver;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Entries</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Loading...' : `${entries.length} entries`}</p>
        </div>
        <Link href="/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
          <PlusCircle className="h-4 w-4" /> Add Entry
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={e => { e.preventDefault(); load(); }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder="Filter by Truck No." value={searchTruck}
              onChange={e => setSearchTruck(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder="Filter by Driver" value={searchDriver}
              onChange={e => setSearchDriver(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>
          <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            <Search className="h-4 w-4" /> Search
          </button>
          {hasFilters && (
            <button type="button" onClick={() => { clearFilters(); setTimeout(load, 0); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading entries...</p>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Table2 className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">No fuel entries found</p>
          <p className="text-sm text-gray-400 mb-5">{hasFilters ? 'Try adjusting your filters' : 'Start by adding your first entry'}</p>
          {!hasFilters && (
            <Link href="/add" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20">
              <PlusCircle className="h-4 w-4" /> Add First Entry
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.truck_no}</p>
                    <p className="text-xs text-gray-500">{fmtDate(entry.date)} • {entry.driver_name}</p>
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                    entry.mileage >= 4 ? 'bg-emerald-50 text-emerald-700' : entry.mileage >= 2.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {entry.mileage} km/L
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Distance</p>
                    <p className="font-medium text-gray-900">{Number(entry.distance).toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Fuel</p>
                    <p className="font-medium text-gray-900">{entry.fuel_qty} L</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Place</p>
                    <p className="font-medium text-gray-900 truncate">{entry.filling_place}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link href={`/edit/${entry.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <button onClick={() => handleDelete(entry.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {['Date','Truck No.','Driver','Phone','Start KM','End KM','Distance','Fuel (L)','Mileage','Place','Actions'].map(h => (
                      <th key={h} className={`px-4 py-3.5 font-semibold text-xs uppercase tracking-wide text-gray-500 ${['Start KM','End KM','Distance','Fuel (L)','Mileage'].includes(h) ? 'text-right' : h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3.5 text-gray-600">{fmtDate(entry.date)}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">{entry.truck_no}</td>
                      <td className="px-4 py-3.5 text-gray-700">{entry.driver_name}</td>
                      <td className="px-4 py-3.5 text-gray-500">{entry.driver_phone}</td>
                      <td className="px-4 py-3.5 text-right text-gray-600">{Number(entry.start_km).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right text-gray-600">{Number(entry.end_km).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{Number(entry.distance).toLocaleString()} km</td>
                      <td className="px-4 py-3.5 text-right text-gray-700">{entry.fuel_qty} L</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          entry.mileage >= 4 ? 'bg-emerald-50 text-emerald-700' : entry.mileage >= 2.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {entry.mileage} km/L
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{entry.filling_place}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/edit/${entry.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleDelete(entry.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
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
        </>
      )}
    </div>
  );
}
