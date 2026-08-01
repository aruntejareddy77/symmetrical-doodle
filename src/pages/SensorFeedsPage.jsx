import { useState, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Radio, Search, Filter, MapPin, Clock,
  Zap, Eye, TrendingUp, ChevronDown,
} from 'lucide-react';

import DashboardLayout from '../components/Layout/DashboardLayout';
import useWebSocket from '../hooks/useWebSocket';

gsap.registerPlugin(useGSAP);

const EVENT_TYPES = [
  'road_obstruction', 'pothole_detected', 'waterlogging',
  'traffic_violation', 'illegal_dumping', 'streetlight_fault',
];

const ASSETS = [
  'CCTV-VZG-101', 'CCTV-VZG-114', 'CCTV-VZG-227', 'CCTV-VZG-335',
  'SENSOR-WL-012', 'SENSOR-WL-045', 'SENSOR-TF-008', 'SENSOR-TF-019',
];

const EVENT_TYPE_CONFIG = {
  road_obstruction: { color: 'var(--status-danger)', icon: '🚧' },
  pothole_detected: { color: 'var(--status-warning)', icon: '🕳️' },
  waterlogging: { color: 'var(--status-info)', icon: '🌊' },
  traffic_violation: { color: 'var(--status-danger)', icon: '🚗' },
  illegal_dumping: { color: 'var(--status-warning)', icon: '🗑️' },
  streetlight_fault: { color: 'var(--text-tertiary)', icon: '💡' },
};

export default function SensorFeedsPage() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [confidenceMin, setConfidenceMin] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const listRef = useRef(null);

  const handleWsMessage = useCallback((event) => {
    if (event.type === 'sensor.new') {
      setEvents((prev) => [event.data, ...prev.slice(0, 199)]);
      setNewCount((c) => c + 1);

      // Auto-clear new count badge after 5s
      setTimeout(() => setNewCount((c) => Math.max(0, c - 1)), 5000);
    }
  }, []);

  const { status: wsStatus } = useWebSocket('ws://localhost:3000/ws', {
    onMessage: handleWsMessage,
    mockMode: true,
  });

  // Entrance animation
  useGSAP(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.querySelectorAll('.sensor-card'),
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.03, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, { dependencies: [events.length] });

  const filtered = events.filter((e) => {
    const matchesSearch = e.event_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.asset_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || e.event_type === typeFilter;
    const matchesConfidence = (e.confidence || 0) >= confidenceMin / 100;
    return matchesSearch && matchesType && matchesConfidence;
  });

  const typeCounts = EVENT_TYPES.reduce((acc, t) => {
    acc[t] = events.filter((e) => e.event_type === t).length;
    return acc;
  }, {});

  return (
    <DashboardLayout wsStatus={wsStatus}>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">
              <Radio size={22} />
              Sensor Feeds
              {newCount > 0 && (
                <span className="live-badge">
                  <span className="live-dot" />
                  {newCount} new
                </span>
              )}
            </h2>
            <p className="page-subtitle">Real-time COC sensor and CCTV event stream</p>
          </div>
          <div className="page-header-right">
            <div className="page-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search events or assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="sensor-filter-bar">
          <div className="sensor-filter-group">
            <label className="sensor-filter-label">Event Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="sensor-select"
            >
              <option value="all">All Types ({events.length})</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')} ({typeCounts[t] || 0})
                </option>
              ))}
            </select>
          </div>
          <div className="sensor-filter-group">
            <label className="sensor-filter-label">Min Confidence: {confidenceMin}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={confidenceMin}
              onChange={(e) => setConfidenceMin(Number(e.target.value))}
              className="sensor-slider"
            />
          </div>
          <div className="sensor-filter-summary">
            <span className="text-sm text-secondary">
              Showing {filtered.length} of {events.length} events
            </span>
          </div>
        </div>

        {/* Event Cards */}
        <div className="sensor-list" ref={listRef}>
          {filtered.length === 0 && events.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Radio size={28} /></div>
              <div className="empty-state-title">Waiting for sensor events...</div>
              <div className="empty-state-desc">Events will appear here as they stream in from the COC network.</div>
            </div>
          )}

          {filtered.length === 0 && events.length > 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Filter size={28} /></div>
              <div className="empty-state-title">No events match filters</div>
              <div className="empty-state-desc">Try adjusting your filter criteria.</div>
            </div>
          )}

          {filtered.map((event) => {
            const config = EVENT_TYPE_CONFIG[event.event_type] || { color: 'var(--text-tertiary)', icon: '📡' };
            return (
              <div key={event.event_id} className="sensor-card">
                <div className="sensor-card-icon" style={{ background: config.color + '18', color: config.color }}>
                  <span style={{ fontSize: '1.2rem' }}>{config.icon}</span>
                </div>
                <div className="sensor-card-body">
                  <div className="sensor-card-top">
                    <span className="sensor-card-type">{event.event_type?.replace(/_/g, ' ')}</span>
                    <span className="sensor-card-id">{event.event_id}</span>
                  </div>
                  <div className="sensor-card-meta">
                    <span className="sensor-meta-item">
                      <Zap size={12} />
                      {event.asset_id}
                    </span>
                    <span className="sensor-meta-item">
                      <MapPin size={12} />
                      {event.location?.lat?.toFixed(4)}, {event.location?.lng?.toFixed(4)}
                    </span>
                    <span className="sensor-meta-item">
                      <Clock size={12} />
                      {event.timestamp
                        ? new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                </div>
                <div className="sensor-card-confidence">
                  <div className="confidence-ring" style={{ '--conf': `${(event.confidence || 0) * 100}%` }}>
                    <span>{((event.confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <span className="text-xs text-tertiary">Confidence</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
