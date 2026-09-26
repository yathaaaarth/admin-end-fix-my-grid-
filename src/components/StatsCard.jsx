export default function StatsCard({ icon: Icon, label, value, color = 'text-primary-500' }) {
  return (
    <div className="bg-white rounded-xl border border-line p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center ${color}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
