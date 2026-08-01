import { useState } from 'react';
import { TrendingUp, Calendar, Download } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';

const VIZAG_WARD_ANALYTICS = [
  { wardId: 'GVMC-W12', zone: 'Siripuram Junction', activeIncidents: 14, totalIngested: 342, avgResponseMin: 2.8, status: 'HIGH_DEMAND', emoji: '🛣️' },
  { wardId: 'GVMC-W22', zone: 'Gajuwaka Industrial Belt', activeIncidents: 22, totalIngested: 412, avgResponseMin: 4.1, status: 'HIGH_DEMAND', emoji: '💨' },
  { wardId: 'GVMC-W14', zone: 'Mudasarlova Catchment', activeIncidents: 9, totalIngested: 286, avgResponseMin: 3.2, status: 'STABLE', emoji: '💧' },
  { wardId: 'GVMC-W15', zone: 'RK Beach Promenade', activeIncidents: 6, totalIngested: 198, avgResponseMin: 3.0, status: 'STABLE', emoji: '🌊' },
  { wardId: 'GVMC-W10', zone: 'MVP Colony Area', activeIncidents: 5, totalIngested: 190, avgResponseMin: 3.5, status: 'STABLE', emoji: '🚰' },
  { wardId: 'GVMC-W08', zone: 'Kailasagiri & Rushikonda', activeIncidents: 4, totalIngested: 145, avgResponseMin: 3.8, status: 'OPTIMAL', emoji: '⛰️' }
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [wardData] = useState(VIZAG_WARD_ANALYTICS);

  return (
    <DashboardLayout>
      <div className="analytics-page space-y-6">
        {/* Minimal Banner */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#283618]">Visakhapatnam Analytics & SLA Metrics</h2>
            <p className="text-xs text-[#606c38]">Live performance metrics across 30 GVMC municipal wards</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#fefae0] border border-[#d4cc9a] rounded-xl p-1 text-xs font-bold text-[#283618]">
              <Calendar size={13} className="ml-1 text-[#606c38]" />
              {['24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-lg uppercase transition-all ${timeRange === range ? 'bg-[#bc6c25] text-[#fefae0]' : 'hover:bg-[#faf5d0]'}`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              onClick={() => alert('Exporting Analytics PDF...')}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#bc6c25] hover:bg-[#dda15e] text-[#fefae0] rounded-xl text-xs font-bold shadow transition-all"
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Top KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#faf5d0] border border-[#d4cc9a] p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#606c38] uppercase">Total Ingested</span>
              <span className="text-sm">📋</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-[#283618]">1,573</span>
              <span className="text-xs font-bold text-green-700 flex items-center gap-0.5">
                <TrendingUp size={11} /> +14.2%
              </span>
            </div>
          </div>

          <div className="bg-[#faf5d0] border border-[#d4cc9a] p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#606c38] uppercase">Auto-Match Rate</span>
              <span className="text-sm">🎯</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-[#bc6c25]">94.8%</span>
              <span className="text-xs font-bold text-green-700">+2.1%</span>
            </div>
          </div>

          <div className="bg-[#faf5d0] border border-[#d4cc9a] p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#606c38] uppercase">Mean Dispatch</span>
              <span className="text-sm">⏱️</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-[#283618]">3.4 min</span>
              <span className="text-xs font-bold text-green-700">-0.8m</span>
            </div>
          </div>

          <div className="bg-[#faf5d0] border border-[#d4cc9a] p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#606c38] uppercase">SLA Success</span>
              <span className="text-sm">✅</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-[#606c38]">91.2%</span>
              <span className="text-xs font-bold text-green-700">+4.5%</span>
            </div>
          </div>
        </div>

        {/* Clean Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Daily Volume Bar Chart */}
          <div className="lg:col-span-2 bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-[#283618] flex items-center gap-1.5">
                <span>📊 Daily Ingestion Volume</span>
              </h3>
              <span className="text-xs font-bold text-[#bc6c25]">7-Day Trend</span>
            </div>

            <div className="h-48 flex items-end justify-between gap-2 pt-4 pb-1 px-1 border-b border-[#d4cc9a]">
              {[
                { label: 'Mon', count: 180, pct: 60 },
                { label: 'Tue', count: 240, pct: 80 },
                { label: 'Wed', count: 310, pct: 100 },
                { label: 'Thu', count: 210, pct: 70 },
                { label: 'Fri', count: 280, pct: 90 },
                { label: 'Sat', count: 150, pct: 50 },
                { label: 'Sun', count: 190, pct: 62 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <span className="text-[10px] font-bold text-[#bc6c25] opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.count}
                  </span>
                  <div
                    style={{ height: `${bar.pct}%` }}
                    className="w-full max-w-[36px] bg-[#bc6c25] rounded-t-lg group-hover:bg-[#dda15e] transition-all"
                  />
                  <span className="text-[11px] font-bold text-[#606c38]">{bar.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-around mt-3 text-xs font-semibold text-[#606c38]">
              <span>🛣️ Roads (42%)</span>
              <span>💧 Water (28%)</span>
              <span>💡 Traffic & Others (30%)</span>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-extrabold text-[#283618] mb-4 flex items-center gap-1.5">
              <span>🍕 Category Share</span>
            </h3>

            <div className="space-y-3">
              {[
                { name: 'Roads & Potholes', pct: 42, color: 'bg-[#bc6c25]', icon: '🛣️' },
                { name: 'Water Line Leaks', pct: 28, color: 'bg-[#dda15e]', icon: '💧' },
                { name: 'Traffic Signals', pct: 16, color: 'bg-[#606c38]', icon: '🚦' },
                { name: 'Sanitation & Waste', pct: 14, color: 'bg-[#8a9460]', icon: '🧹' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#283618]">
                    <span className="flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#fefae0] border border-[#d4cc9a] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#d4cc9a] text-[11px] text-[#606c38]">
              💡 <b>Insight:</b> Ward 12 & 22 account for 42% of pothole complaints.
            </div>
          </div>
        </div>

        {/* GVMC Ward Spatial Table */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#d4cc9a] bg-[#fefae0] flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#283618] flex items-center gap-1.5">
              <span>🗺️ GVMC Ward Spatial Demand</span>
            </h3>
            <span className="text-xs font-bold text-[#bc6c25]">6 Pilot Wards</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#faf5d0] border-b border-[#d4cc9a] font-bold text-[#606c38] uppercase">
                  <th className="p-3 pl-4">Ward</th>
                  <th className="p-3">Zone / Locality</th>
                  <th className="p-3">Active Incidents</th>
                  <th className="p-3">Total Ingested</th>
                  <th className="p-3">Avg Response</th>
                  <th className="p-3 pr-4">Demand Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4cc9a]/40 text-[#283618]">
                {wardData.map((w) => (
                  <tr key={w.wardId} className="hover:bg-[#fefae0]/60 transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-[#bc6c25] flex items-center gap-1.5">
                      <span>{w.emoji}</span>
                      <span>{w.wardId}</span>
                    </td>
                    <td className="p-3 font-bold">{w.zone}</td>
                    <td className="p-3 font-bold text-amber-700">{w.activeIncidents} active</td>
                    <td className="p-3 font-mono text-[#606c38]">{w.totalIngested}</td>
                    <td className="p-3 font-mono font-bold">{w.avgResponseMin} min</td>
                    <td className="p-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        w.status === 'HIGH_DEMAND' ? 'bg-red-500/20 text-red-800' :
                        w.status === 'STABLE' ? 'bg-amber-500/20 text-amber-800' :
                        'bg-green-500/20 text-green-800'
                      }`}>
                        {w.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
