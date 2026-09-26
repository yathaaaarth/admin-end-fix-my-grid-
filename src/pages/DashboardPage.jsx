import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getIssues } from '../api/authority';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import {
  AlertCircle,
  FileText,
  Copy,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_COLORS = {
  Reported: '#3B82F6',
  Verified: '#6366F1',
  Assigned: '#8B5CF6',
  'In progress': '#F59E0B',
  Resolved: '#22C55E',
  Rejected: '#9CA3AF',
};

const SEV_COLORS = {
  Critical: '#DC2626',
  High: '#EA580C',
  Medium: '#EAB308',
  Low: '#22C55E',
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, issues] = await Promise.all([
          getStats(),
          getIssues(),
        ]);
        setStats(s);
        setRecentIssues(issues.slice(0, 8));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-muted">Failed to load dashboard data.</div>
    );
  }

  const statusData = Object.entries(stats.by_status || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const sevData = Object.entries(stats.by_severity || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const deptData = Object.entries(stats.by_department || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Overview of all civic issues</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard icon={AlertCircle} label="Open Issues" value={stats.open} />
        <StatsCard icon={FileText} label="Total Issues" value={stats.total} />
        <StatsCard icon={Clock} label="Reported (24h)" value={stats.reported_today} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Status donut */}
        <div className="bg-white rounded-xl border border-line p-5">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
            By Status
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || '#D1D5DB'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity bar */}
        <div className="bg-white rounded-xl border border-line p-5">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
            By Severity
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {sevData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEV_COLORS[entry.name] || '#6B7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department bar */}
        <div className="bg-white rounded-xl border border-line p-5">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
            By Department
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#1A73E8" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Map view */}
      <div className="bg-white rounded-xl border border-line p-5 mb-8">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
          Live Issue Map
        </h3>
        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-line z-0 relative">
          <MapContainer 
            center={[28.6139, 77.2090]} // default center (Delhi)
            zoom={11} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              url="https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieWF0aHUxMTExIiwiYSI6ImNtdWlteGs5OTAzcTEyd3B5NXgxa3VsYjMifQ.n9wAJSOr7BNy6NXbOd11KA"
              attribution='Map data &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
            />
            {recentIssues.filter(i => i.latitude && i.longitude).map(issue => (
              <Marker 
                key={issue.id} 
                position={[issue.latitude, issue.longitude]}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>#{issue.id} - {issue.category}</strong>
                    <br />
                    <StatusBadge status={issue.status} />
                    <br />
                    <Link to={`/issues/${issue.id}`} className="text-primary-500 hover:underline">
                      View details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Recent issues table */}
      <div className="bg-white rounded-xl border border-line">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h3 className="text-sm font-semibold text-ink">Recent Open Issues</h3>
          <Link
            to="/issues"
            className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-700"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Photo</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Description</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Severity</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Department</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted">
                    No open issues. Nice work! 🎉
                  </td>
                </tr>
              ) : (
                recentIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold">#{issue.id}</td>
                    <td className="px-5 py-3">
                      {issue.image_url ? (
                        <img
                          src={issue.image_url}
                          alt=""
                          className="w-14 h-10 object-cover rounded-md border border-line"
                        />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 max-w-[200px] truncate">
                      {issue.description || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-5 py-3 text-muted text-xs">
                      {issue.department || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="text-primary-500 hover:text-primary-700 font-medium text-xs"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
