'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Fuel, Truck, Users, TrendingUp, Route, ListChecks } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byTruck, setByTruck] = useState([]);
  const [byDriver, setByDriver] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/fuel-entries/analytics/summary').then(r => r.json()),
      fetch('/api/fuel-entries/analytics/by-truck').then(r => r.json()),
      fetch('/api/fuel-entries/analytics/by-driver').then(r => r.json()),
      fetch('/api/fuel-entries/analytics/mileage-trend').then(r => r.json()),
    ]).then(([s, bt, bd, tr]) => {
      if (s.error) throw new Error(s.error);
      setSummary(s);
      setByTruck(bt);
      setByDriver(bd);
      setTrend(tr.slice(-30));
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard…</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">Error: {error}</div>;

  const isEmpty = !summary || Number(summary.total_entries) === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <a href="/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Entry
        </a>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={ListChecks} label="Total Entries"   value={summary?.total_entries}   color="bg-blue-500" />
        <StatCard icon={Fuel}       label="Total Fuel (L)"  value={summary?.total_fuel}       color="bg-orange-500" />
        <StatCard icon={Route}      label="Distance (km)"   value={summary?.total_distance}   color="bg-green-500" />
        <StatCard icon={TrendingUp} label="Avg Mileage"     value={summary?.avg_mileage ? `${summary.avg_mileage} km/L` : '—'} color="bg-purple-500" />
        <StatCard icon={Truck}      label="Trucks"          value={summary?.total_trucks}     color="bg-cyan-500" />
        <StatCard icon={Users}      label="Drivers"         value={summary?.total_drivers}    color="bg-pink-500" />
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <p className="text-gray-500 mb-4">No fuel entries yet. Add one to see your charts.</p>
          <a href="/add" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add First Entry</a>
        </div>
      ) : (
        <>
          {/* Row 1: Fuel per Truck + Mileage Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Fuel Filled per Truck (L)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="truck_no" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} L`, 'Fuel']} />
                  <Bar dataKey="total_fuel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Mileage Trend (km/L)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} unit=" km/L" />
                  <Tooltip formatter={(v) => [`${v} km/L`, 'Mileage']} />
                  <Line type="monotone" dataKey="mileage" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Avg Mileage per Truck + Fuel by Driver Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Avg Mileage per Truck (km/L)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="truck_no" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} km/L`, 'Avg Mileage']} />
                  <Bar dataKey="avg_mileage" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Fuel Distribution by Driver</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={byDriver}
                    dataKey="total_fuel"
                    nameKey="driver_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ driver_name, percent }) => `${driver_name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {byDriver.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} L`, 'Fuel']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Distance per Truck */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Total Distance per Truck (km)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="truck_no" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 12 }} unit=" km" />
                <Tooltip formatter={(v) => [`${v} km`, 'Distance']} />
                <Bar dataKey="total_distance" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
