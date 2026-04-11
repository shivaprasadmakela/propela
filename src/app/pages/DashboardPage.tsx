export function DashboardPage() {
  const stats = [
    { label: 'Total Deals', value: '48', change: '+5', positive: true, icon: '◈' },
    { label: 'Pipeline Value', value: '$1.24M', change: '+12.5%', positive: true, icon: '💰' },
    { label: 'Won This Month', value: '12', change: '+3', positive: true, icon: '🏆' },
    { label: 'Avg. Deal Size', value: '$25.8K', change: '-2.1%', positive: false, icon: '📊' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-foreground/40 mt-1">Overview of your sales pipeline and activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-5 rounded-2xl bg-muted/20 border border-border hover:border-border/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <span className={`text-xs font-medium ${s.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {s.change} from last month
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
