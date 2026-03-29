'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Search, PlusCircle } from 'lucide-react';

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Entries</h1>
        <Link href="/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <PlusCircle className="h-4 w-4" /> Add Entry
        </Link>
      </div>

      <form onSubmit={e => { e.preventDefault(); load(); }} className="flex flex-wrap gap-3 mb-6">
        <input
          type="text" placeholder="Filter by Truck No." value={searchTruck}
          onChange={e => setSearchTruck(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="text" placeholder="Filter by Driver" value={searchDriver}
          onChange={e => setSearchDriver(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
          <Search className="h-4 w-4" /> Search
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No fuel entries found.</p>
          <Link href="/add" className="text-blue-600 hover:underline font-medium">Add your first entry</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Date','Truck No.','Driver','Phone','Start KM','End KM','Distance','Fuel (L)','Mileage','Place','Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 ${['Start KM','End KM','Distance','Fuel (L)','Mileage'].includes(h) ? 'text-right' : h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">{fmtDate(entry.date)}</td>
                    <td className="px-4 py-3 font-medium">{entry.truck_no}</td>
                    <td className="px-4 py-3">{entry.driver_name}</td>
                    <td className="px-4 py-3">{entry.driver_phone}</td>
                    <td className="px-4 py-3 text-right">{Number(entry.start_km).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{Number(entry.end_km).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(entry.distance).toLocaleString()} km</td>
                    <td className="px-4 py-3 text-right">{entry.fuel_qty} L</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        entry.mileage >= 4 ? 'bg-green-100 text-green-800' : entry.mileage >= 2.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {entry.mileage} km/L
                      </span>
                    </td>
                    <td className="px-4 py-3">{entry.filling_place}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/edit/${entry.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Pencil className="h-4 w-4" />
                        </Link>
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
