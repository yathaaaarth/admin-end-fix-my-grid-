import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIssues } from '../api/authority';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { Search, Filter, RefreshCw, Clock } from 'lucide-react';

const STATUSES = ['', 'reported', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected'];
const SEVERITIES = ['', 'low', 'medium', 'high', 'critical'];

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [includeResolved, setIncludeResolved] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (includeResolved) params.include_resolved = '1';
      const data = await getIssues(params);
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, severityFilter, includeResolved]);

  const filtered = issues.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(i.id).includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      (i.department || '').toLowerCase().includes(q) ||
      (i.reporter_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Issues</h1>
          <p className="text-sm text-muted mt-1">
            {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-line p-4 mb-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-muted" />

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues..."
            className="pl-8 pr-3 py-2 text-sm rounded-lg border border-line bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-line bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-line bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Severities</option>
          {SEVERITIES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
            className="rounded border-line text-primary-500 focus:ring-primary-500"
          />
          Include resolved
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Photo</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Description</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Category</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Severity</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Department</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Reporter</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted uppercase">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-muted">
                      No issues match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((issue) => {
                    const daysOpen = Math.floor((new Date() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24));
                    const isOverdue = issue.status !== 'resolved' && issue.status !== 'rejected' && daysOpen > 7;

                    return (
                      <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-semibold">
                          #{issue.id}
                          {isOverdue && (
                            <span className="ml-2 inline-flex items-center text-red-600" title={`Overdue (${daysOpen} days)`}>
                              <Clock size={14} />
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                        {issue.image_url ? (
                          <img
                            src={issue.image_url}
                            alt=""
                            className="w-14 h-10 object-cover rounded-md border border-line"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 max-w-[180px] truncate">
                        {issue.description || '—'}
                      </td>
                      <td className="px-5 py-3 text-xs capitalize">
                        {(issue.category || '').replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3">
                        <SeverityBadge severity={issue.severity} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {issue.department || '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {issue.reporter_email || '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                        {new Date(issue.created_at).toLocaleDateString()}
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
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
