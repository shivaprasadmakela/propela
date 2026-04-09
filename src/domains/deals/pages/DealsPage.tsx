import { useState } from 'react';

const mockDeals = [
  { id: 1, name: 'Enterprise SaaS Contract', company: 'Acme Corp', value: '$125,000', stage: 'Negotiation', probability: '75%', owner: 'Sarah Chen', updatedAt: '2h ago' },
  { id: 2, name: 'Platform License Renewal', company: 'TechStart Inc', value: '$45,000', stage: 'Proposal', probability: '60%', owner: 'Mike Ross', updatedAt: '4h ago' },
  { id: 3, name: 'Annual Support Package', company: 'DataFlow Ltd', value: '$32,000', stage: 'Qualification', probability: '40%', owner: 'Alex Kim', updatedAt: '1d ago' },
  { id: 4, name: 'Custom Integration Build', company: 'CloudNine', value: '$89,000', stage: 'Negotiation', probability: '80%', owner: 'Sarah Chen', updatedAt: '3h ago' },
  { id: 5, name: 'Startup Bundle Deal', company: 'LaunchPad', value: '$18,500', stage: 'Discovery', probability: '25%', owner: 'Jordan Lee', updatedAt: '5h ago' },
  { id: 6, name: 'Government Contract Bid', company: 'GovTech Agency', value: '$250,000', stage: 'Proposal', probability: '50%', owner: 'Mike Ross', updatedAt: '2d ago' },
  { id: 7, name: 'API Access Tier Upgrade', company: 'DevHub', value: '$12,000', stage: 'Closed Won', probability: '100%', owner: 'Alex Kim', updatedAt: '6h ago' },
  { id: 8, name: 'Multi-region Deployment', company: 'GlobalScale', value: '$175,000', stage: 'Discovery', probability: '30%', owner: 'Jordan Lee', updatedAt: '1d ago' },
];

const stageColors: Record<string, string> = {
  'Discovery': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Qualification': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Proposal': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Negotiation': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'Closed Won': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Closed Lost': 'bg-red-500/15 text-red-400 border-red-500/20',
};



export function DealsPage() {
  const [search, setSearch] = useState('');

  const filtered = mockDeals.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deals</h1>
          <p className="text-sm text-white/40 mt-1">Manage and track your sales pipeline</p>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2">
          <span className="text-lg leading-none">+</span>
          New Deal
        </button>
      </div>



      {/* Table card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 text-sm outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all w-64"
              />
            </div>
            <button className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/50 text-sm hover:bg-white/[0.06] hover:text-white/70 transition-all flex items-center gap-2">
              <span>⫶</span> Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">{filtered.length} deals</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Deal', 'Company', 'Value', 'Stage', 'Probability', 'Owner', 'Updated'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-white/30 uppercase tracking-wider px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((deal, i) => (
                <tr
                  key={deal.id}
                  className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                    i === filtered.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-white/90 group-hover:text-indigo-400 transition-colors">
                      {deal.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-white/50">{deal.company}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-white/80">{deal.value}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        stageColors[deal.stage] || 'bg-white/5 text-white/50 border-white/10'
                      }`}
                    >
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-white/50">{deal.probability}</td>
                  <td className="px-5 py-4 text-sm text-white/50">{deal.owner}</td>
                  <td className="px-5 py-4 text-xs text-white/30">{deal.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
          <span className="text-xs text-white/30">Showing 1–{filtered.length} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:bg-white/[0.04] transition-colors">Prev</button>
            <button className="px-3 py-1.5 rounded-lg text-xs bg-indigo-500/15 text-indigo-400 font-medium">1</button>
            <button className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:bg-white/[0.04] transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
