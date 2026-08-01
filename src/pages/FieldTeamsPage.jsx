import { useState, useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Users, MapPin, Clock, Search, Filter,
  Navigation, Phone, CheckCircle2, AlertTriangle,
  ChevronDown, Send,
} from 'lucide-react';

import DashboardLayout from '../components/Layout/DashboardLayout';
import useWebSocket, { VIZAG_LOCATIONS } from '../hooks/useWebSocket';

gsap.registerPlugin(useGSAP);

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'var(--status-success)', badge: 'badge-success' },
  en_route: { label: 'En Route', color: 'var(--status-info)', badge: 'badge-info' },
  on_site: { label: 'On Site', color: 'var(--status-warning)', badge: 'badge-warning' },
  done: { label: 'Done', color: 'var(--text-tertiary)', badge: 'badge-accent' },
  offline: { label: 'Offline', color: 'var(--text-tertiary)', badge: 'badge-accent' },
};

const TEAM_NAMES = [
  'Alpha Unit', 'Bravo Squad', 'Charlie Team', 'Delta Force',
  'Echo Patrol', 'Foxtrot Unit', 'Golf Brigade', 'Hotel Crew',
  'India Response', 'Juliet Patrol', 'Kilo Unit', 'Lima Squad',
];

const SPECIALIZATIONS = [
  'Road Maintenance', 'Drainage', 'Electrical', 'General Response',
  'Water Supply', 'Sanitation', 'Emergency', 'Traffic',
];

function generateMockTeams() {
  return Array.from({ length: 12 }, (_, i) => {
    const base = VIZAG_LOCATIONS[i % VIZAG_LOCATIONS.length];
    return {
      team_id: `FT-${String(i + 1).padStart(2, '0')}`,
      name: TEAM_NAMES[i],
      status: ['available', 'en_route', 'on_site', 'available', 'en_route', 'available'][Math.floor(Math.random() * 6)],
      specialization: SPECIALIZATIONS[i % SPECIALIZATIONS.length],
      members: Math.floor(Math.random() * 3) + 2,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      location: {
        lat: base.lat + (Math.random() - 0.5) * 0.005,
        lng: base.lng + (Math.random() - 0.5) * 0.005,
        name: base.name,
      },
      active_assignments: Math.floor(Math.random() * 3),
      completed_today: Math.floor(Math.random() * 8),
      updated_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    };
  });
}

export default function FieldTeamsPage() {
  const [teams, setTeams] = useState(() => generateMockTeams());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const tableRef = useRef(null);

  const handleWsMessage = useCallback((event) => {
    if (event.type === 'team.update') {
      setTeams((prev) => {
        const idx = prev.findIndex((t) => t.team_id === event.data.team_id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...event.data, updated_at: new Date().toISOString() };
          return updated;
        }
        return prev;
      });
    }
  }, []);

  const { status: wsStatus } = useWebSocket('ws://localhost:3000/ws', {
    onMessage: handleWsMessage,
    mockMode: true,
  });

  // Entrance animation
  useGSAP(() => {
    if (tableRef.current) {
      gsap.fromTo(
        tableRef.current.querySelectorAll('.team-row'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.04, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, { dependencies: [] });

  const filteredTeams = teams.filter((t) => {
    const matchesSearch = t.team_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: teams.length,
    available: teams.filter((t) => t.status === 'available').length,
    en_route: teams.filter((t) => t.status === 'en_route').length,
    on_site: teams.filter((t) => t.status === 'on_site').length,
  };

  const timeAgo = (isoStr) => {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <DashboardLayout wsStatus={wsStatus}>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">
              <Users size={22} />
              Field Teams
            </h2>
            <p className="page-subtitle">Monitor and dispatch field teams in real-time</p>
          </div>
          <div className="page-header-right">
            <div className="page-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="status-tabs">
          {[
            { key: 'all', label: 'All Teams' },
            { key: 'available', label: 'Available' },
            { key: 'en_route', label: 'En Route' },
            { key: 'on_site', label: 'On Site' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`status-tab ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              <span className="status-tab-count">{statusCounts[tab.key]}</span>
            </button>
          ))}
        </div>

        {/* Teams Table */}
        <div className="teams-table-wrapper" ref={tableRef}>
          <table className="teams-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Status</th>
                <th>Specialization</th>
                <th>Location</th>
                <th>Active</th>
                <th>Completed</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <tr
                  key={team.team_id}
                  className={`team-row ${selectedTeam?.team_id === team.team_id ? 'selected' : ''}`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <td>
                    <div className="team-cell-name">
                      <div className="team-avatar">
                        {team.team_id.slice(-2)}
                      </div>
                      <div>
                        <div className="team-name">{team.name}</div>
                        <div className="team-id">{team.team_id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CONFIG[team.status]?.badge || 'badge-accent'}`}>
                      {STATUS_CONFIG[team.status]?.label || team.status}
                    </span>
                  </td>
                  <td className="text-sm">{team.specialization}</td>
                  <td>
                    <div className="team-location-cell">
                      <MapPin size={12} />
                      <span>{team.location?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="team-stat">{team.active_assignments}</span>
                  </td>
                  <td>
                    <span className="team-stat completed">{team.completed_today}</span>
                  </td>
                  <td>
                    <div className="team-time-cell">
                      <Clock size={12} />
                      <span>{timeAgo(team.updated_at)}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-dispatch"
                      disabled={team.status !== 'available'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeams((prev) =>
                          prev.map((t) =>
                            t.team_id === team.team_id
                              ? { ...t, status: 'en_route', updated_at: new Date().toISOString() }
                              : t
                          )
                        );
                      }}
                    >
                      <Send size={14} />
                      Dispatch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTeams.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={28} /></div>
              <div className="empty-state-title">No teams found</div>
              <div className="empty-state-desc">Try adjusting your search or filter criteria.</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
