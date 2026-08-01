import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  BarChart3, TrendingUp, Clock, Users, AlertTriangle,
  CheckCircle2, Target, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

import DashboardLayout from '../components/Layout/DashboardLayout';

gsap.registerPlugin(useGSAP);

// Mock analytics data
const HOURLY_COMPLAINTS = [12, 18, 24, 15, 32, 28, 45, 52, 41, 68, 55, 72, 48, 63, 45, 58, 70, 80, 65, 42, 35, 28, 20, 14];
const DAILY_COMPLAINTS = [120, 145, 132, 168, 155, 142, 178];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_DATA = [
  { label: 'Pothole', value: 38, color: 'var(--status-danger)' },
  { label: 'Road Obstruction', value: 24, color: 'var(--status-warning)' },
  { label: 'Waterlogging', value: 18, color: 'var(--status-info)' },
  { label: 'Streetlight', value: 12, color: 'var(--text-secondary)' },
  { label: 'Other', value: 8, color: 'var(--text-tertiary)' },
];

const WARD_PERFORMANCE = [
  { ward: 'GVMC-W12', resolved: 85, pending: 12, avg_time: '4.2h' },
  { ward: 'GVMC-W08', resolved: 72, pending: 18, avg_time: '5.8h' },
  { ward: 'GVMC-W15', resolved: 68, pending: 22, avg_time: '6.1h' },
  { ward: 'GVMC-W03', resolved: 91, pending: 8, avg_time: '3.5h' },
  { ward: 'GVMC-W21', resolved: 56, pending: 31, avg_time: '7.2h' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('today');
  const gridRef = useRef(null);

  // Entrance animation
  useGSAP(() => {
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.querySelectorAll('.analytics-card'),
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, { dependencies: [] });

  const maxHourly = Math.max(...HOURLY_COMPLAINTS);
  const maxDaily = Math.max(...DAILY_COMPLAINTS);
  const totalCategory = CATEGORY_DATA.reduce((s, c) => s + c.value, 0);

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">
              <BarChart3 size={22} />
              Analytics
            </h2>
            <p className="page-subtitle">Performance metrics and operational insights</p>
          </div>
          <div className="page-header-right">
            <div className="time-range-tabs">
              {['today', 'week', 'month'].map((range) => (
                <button
                  key={range}
                  className={`time-range-tab ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="analytics-kpi-row" ref={gridRef}>
          <div className="analytics-card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Total Complaints</span>
              <div className="stat-card-icon orange"><AlertTriangle size={18} /></div>
            </div>
            <div className="kpi-value">247</div>
            <div className="kpi-trend up">
              <ArrowUpRight size={14} />
              <span>+12% from yesterday</span>
            </div>
          </div>

          <div className="analytics-card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Resolved</span>
              <div className="stat-card-icon green"><CheckCircle2 size={18} /></div>
            </div>
            <div className="kpi-value">198</div>
            <div className="kpi-trend up">
              <ArrowUpRight size={14} />
              <span>80.2% resolution rate</span>
            </div>
          </div>

          <div className="analytics-card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Avg. Dispatch Time</span>
              <div className="stat-card-icon blue"><Clock size={18} /></div>
            </div>
            <div className="kpi-value">4.2<span className="kpi-unit">min</span></div>
            <div className="kpi-trend down">
              <ArrowDownRight size={14} />
              <span>-18% improvement</span>
            </div>
          </div>

          <div className="analytics-card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Match Rate</span>
              <div className="stat-card-icon orange"><Target size={18} /></div>
            </div>
            <div className="kpi-value">92<span className="kpi-unit">%</span></div>
            <div className="kpi-trend up">
              <ArrowUpRight size={14} />
              <span>Target: 90%</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="analytics-charts-row">
          {/* Complaint Volume */}
          <div className="analytics-card chart-card wide">
            <div className="chart-header">
              <div>
                <span className="chart-title">Complaint Volume</span>
                <span className="chart-subtitle">Hourly distribution</span>
              </div>
              <span className="badge badge-accent">Live</span>
            </div>
            <div className="bar-chart">
              {HOURLY_COMPLAINTS.map((val, i) => (
                <div key={i} className="bar-column">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(val / maxHourly) * 100}%`,
                      background: i === new Date().getHours()
                        ? 'var(--accent-gradient)'
                        : 'var(--accent-light)',
                    }}
                  />
                  <span className="bar-label">{i % 4 === 0 ? `${String(i).padStart(2, '0')}:00` : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="analytics-card chart-card">
            <div className="chart-header">
              <div>
                <span className="chart-title">Category Breakdown</span>
                <span className="chart-subtitle">By complaint type</span>
              </div>
            </div>
            <div className="category-chart">
              <div className="donut-chart">
                <svg viewBox="0 0 120 120">
                  {(() => {
                    let cumulative = 0;
                    return CATEGORY_DATA.map((cat, i) => {
                      const pct = cat.value / totalCategory;
                      const dashArray = pct * 314;
                      const dashOffset = -cumulative * 314;
                      cumulative += pct;
                      return (
                        <circle
                          key={i}
                          cx="60" cy="60" r="50"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="12"
                          strokeDasharray={`${dashArray} ${314 - dashArray}`}
                          strokeDashoffset={dashOffset}
                          style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="donut-center">
                  <span className="donut-value">{totalCategory}</span>
                  <span className="donut-label">Total</span>
                </div>
              </div>
              <div className="category-legend">
                {CATEGORY_DATA.map((cat) => (
                  <div key={cat.label} className="category-legend-item">
                    <span className="category-dot" style={{ background: cat.color }} />
                    <span className="category-name">{cat.label}</span>
                    <span className="category-pct">{((cat.value / totalCategory) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="analytics-charts-row">
          {/* Weekly Trend */}
          <div className="analytics-card chart-card">
            <div className="chart-header">
              <div>
                <span className="chart-title">Weekly Trend</span>
                <span className="chart-subtitle">Daily complaint volume</span>
              </div>
              <span className="badge badge-success">On Track</span>
            </div>
            <div className="bar-chart weekly">
              {DAILY_COMPLAINTS.map((val, i) => (
                <div key={i} className="bar-column">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(val / maxDaily) * 100}%`,
                      background: i === new Date().getDay() - 1
                        ? 'var(--accent-gradient)'
                        : 'var(--accent-light)',
                      borderRadius: '6px 6px 0 0',
                    }}
                  />
                  <span className="bar-label">{DAY_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ward Performance */}
          <div className="analytics-card chart-card wide">
            <div className="chart-header">
              <div>
                <span className="chart-title">Ward Performance</span>
                <span className="chart-subtitle">Resolution rate by ward</span>
              </div>
            </div>
            <div className="ward-table">
              <div className="ward-table-header">
                <span>Ward</span>
                <span>Resolution</span>
                <span>Pending</span>
                <span>Avg. Time</span>
              </div>
              {WARD_PERFORMANCE.map((ward) => (
                <div key={ward.ward} className="ward-table-row">
                  <span className="font-semibold text-sm">{ward.ward}</span>
                  <div className="ward-bar-cell">
                    <div className="ward-bar">
                      <div
                        className="ward-bar-fill"
                        style={{
                          width: `${ward.resolved}%`,
                          background: ward.resolved > 80 ? 'var(--status-success)' : ward.resolved > 60 ? 'var(--status-warning)' : 'var(--status-danger)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{ward.resolved}%</span>
                  </div>
                  <span className="text-sm">{ward.pending}</span>
                  <span className="text-sm">{ward.avg_time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
