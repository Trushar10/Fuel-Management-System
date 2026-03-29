'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Fuel, Truck, Users, TrendingUp, Route, ListChecks, PlusCircle, ArrowRight } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const STAT_CONFIG = [
  { key: 'total_entries', label: 'Total Entries', icon: ListChecks, gradient: 'from-blue-500 to-blue-600' },
  { key: 'total_fuel', label: 'Total Fuel (L)', icon: Fuel, gradient: 'from-orange-500 to-orange-600' },
  { key: 'total_distance', label: 'Distance (km)', icon: Route, gradient: 'from-emerald-500 to-emerald-600' },
  { key: 'avg_mileage', label: 'Avg Mileage', icon: TrendingUp, gradient: 'from-violet-500 to-violet-600', suffix: ' km/L' },
  { key: 'total_trucks', label: 'Trucks', icon: Truck, gradient: 'from-cyan-500 to-cyan-600' },
  { key: 'total_drivers', label: 'Drivers', icon: Users, gradient: 'from-pink-500 to-pink-600' },
];

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    </div>
  );

  const isEmpty = !summary || Number(summary.total_entries) === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fleet fuel consumption overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/entries" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <ListChecks className="h-4 w-4" /> View Entries
          </Link>
          <Link href="/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
            <PlusCircle className="h-4 w-4" /> Add Entry
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {STAT_CONFIG.map(({ key, label, icon, gradient, suffix }) => (
          <StatCard
            key={key} icon={icon} label={label} gradient={gradient}
            value={summary?.[key] ? `${summary[key]}${suffix || ''}` : '—'}
          />
        ))}
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 sm:p-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Fuel className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 mb-1 font-medium">No fuel entries yet</p>
          <p className="text-sm text-gray-400 mb-6">Add your first entry to see charts and analytics</p>
          <Link href="/add" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
            <PlusCircle className="h-4 w-4" /> Add First Entry
          </Link>
        </div>
      ) : (
        <>
          {/* Row 1: Fuel per Truck + Mileage Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Fuel Filled per Truck (L)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="truck_no" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v} L`, 'Fuel']} />
                  <Bar dataKey="total_fuel" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Mileage Trend (km/L)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} unit=" km/L" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v} km/L`, 'Mileage']} />
                  <Line type="monotone" dataKey="mileage" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 2: Avg Mileage per Truck + Fuel by Driver Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Avg Mileage per Truck (km/L)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="truck_no" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v} km/L`, 'Avg Mileage']} />
                  <Bar dataKey="avg_mileage" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Fuel Distribution by Driver">
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
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v} L`, 'Fuel']} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 3: Distance per Truck */}
          <ChartCard title="Total Distance per Truck (km)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byTruck} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="truck_no" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 12 }} unit=" km" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v} km`, 'Distance']} />
                <Bar dataKey="total_distance" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
}
