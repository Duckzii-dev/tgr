export default function StatCard({ label, value, sub, icon: Icon }) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between text-ink-400 text-xs uppercase tracking-wide">
          <span>{label}</span>
          {Icon && <Icon className="w-4 h-4" />}
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-ink-400 mt-1">{sub}</div>}
      </div>
    );
  }