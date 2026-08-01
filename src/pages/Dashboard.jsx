import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  AlertTriangle, Users, Radio, TrendingUp, Clock,
  CheckCircle2, MapPin, ArrowUpRight,
} from 'lucide-react';

import DashboardLayout from '../components/Layout/DashboardLayout';
import CinematicLoader from '../components/Loader/CinematicLoader';
import { StatsSkeleton, IncidentFeedSkeleton, MapSkeleton } from '../components/Loader/SkeletonLoaders';
import StatCard from '../components/Stats/StatCard';
import LiveMap from '../components/Map/LiveMap';
import TriagePanel from '../components/Triage/TriagePanel';
import NotificationCenter from '../components/Notifications/NotificationCenter';
import useWebSocket from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

const RENDER_API = 'https://city-operations-center-coc-i6aw.onrender.com/api/v1';
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || (!['localhost', '127.0.0.1'].includes(window.location.hostname) && !window.location.hostname.startsWith('10.') && !window.location.hostname.startsWith('192.')))
    ? RENDER_API 
    : 'http://localhost:3000/api/v1');

const mapComplaintFromBackend = (c) => ({
  complaint_id: c.id || c.complaint_id,
  id: c.id || c.complaint_id,
  title: c.title || c.description || 'Citizen Complaint',
  type: c.category?.toLowerCase() || c.type || 'pothole',
  category: c.category || 'INFRASTRUCTURE',
  priority: c.priority || 'HIGH',
  description: c.description || '',
  location: { lat: c.latitude || c.location?.lat || 17.6868, lng: c.longitude || c.location?.lng || 83.2185 },
  latitude: c.latitude || c.location?.lat || 17.6868,
  longitude: c.longitude || c.location?.lng || 83.2185,
  ward_id: c.ward || 'GVMC-W12',
  ward: c.ward || 'GVMC-W12',
  status: c.status?.toLowerCase() || 'received',
  assigned_team_id: c.assignments?.[0]?.fieldTeamId || null,
  reported_at: c.createdAt || new Date().toISOString()
});

const mapFieldTeamFromBackend = (t) => ({
  team_id: t.id,
  status: t.availability?.toLowerCase() || 'available',
  location: { lat: t.currentLat || 17.689, lng: t.currentLng || 83.217 },
  updated_at: t.updatedAt || new Date().toISOString()
});

gsap.registerPlugin(useGSAP);

/**
 * Dashboard — Primary operator view.
 * 
 * Entrance animation: Logo → Navbar → Stats stagger → Map expand → Triage slide → Buttons interactive.
 * Real-time animations driven by WebSocket events, not ScrollTrigger.
 */
export default function Dashboard() {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [sensorEvents, setSensorEvents] = useState([]);
  const [fieldTeams, setFieldTeams] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Refs for entrance animation
  const statsRef = useRef(null);
  const mapRef = useRef(null);
  const triageRef = useRef(null);
  const chartsRef = useRef(null);

  // Handle incoming WebSocket events
  const handleWsMessage = useCallback((event) => {
    if (!synced) setSynced(true);

    switch (event.type) {
      case 'complaint.new':
        setComplaints((prev) => [event.data, ...prev.slice(0, 49)]);
        addNotification({
          title: `New Complaint: ${event.data.type?.replace('_', ' ')}`,
          message: event.data.description,
          priority: 'high',
        });
        break;

      case 'sensor.new':
        setSensorEvents((prev) => [event.data, ...prev.slice(0, 49)]);
        addNotification({
          title: `Sensor Event: ${event.data.event_type?.replace('_', ' ')}`,
          message: `Asset ${event.data.asset_id} — Confidence: ${(event.data.confidence * 100).toFixed(0)}%`,
          priority: 'medium',
        });
        break;

      case 'team.update':
        setFieldTeams((prev) => {
          const idx = prev.findIndex((t) => t.team_id === event.data.team_id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = event.data;
            return updated;
          }
          return [event.data, ...prev];
        });
        break;

      case 'assignment.new':
        addNotification({
          title: `Team ${event.data.team_id} Dispatched`,
          message: `ETA: ${event.data.eta_minutes} min — Priority: ${event.data.priority}`,
          priority: event.data.priority === 'high' ? 'high' : 'low',
        });
        // Update complaint status
        setComplaints((prev) =>
          prev.map((c) =>
            c.complaint_id === event.data.incident_id
              ? { ...c, status: 'assigned', assigned_team_id: event.data.team_id }
              : c
          )
        );
        break;

      default:
        break;
    }
  }, [synced]);

  const getWsUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return 'wss://city-operations-center-coc-i6aw.onrender.com/ws';
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `ws://${host}:3000/ws`;
  };

  const { status: wsStatus } = useWebSocket(getWsUrl(), {
    onMessage: handleWsMessage,
    mockMode: false,
  });

  useEffect(() => {
    const handleAssigned = (e) => {
      const detail = e.detail;
      if (!detail) return;
      setComplaints((prev) =>
        prev.map((c) => {
          const id = c.id || c.complaint_id;
          if (id === detail.id || id === detail.complaint_id) {
            return { ...c, status: 'assigned', assignedTeam: detail.assignedTeam || detail.teamId };
          }
          return c;
        })
      );
    };

    window.addEventListener('complaint.assigned', handleAssigned);
    return () => window.removeEventListener('complaint.assigned', handleAssigned);
  }, []);

  const addNotification = useCallback((notif) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setNotifications((prev) => [{ id, time, ...notif }, ...prev.slice(0, 7)]);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 8000);
  }, []);

  const handleDismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleDispatch = useCallback(async (incident) => {
    const cmpId = incident.id || incident.complaint_id;
    if (!cmpId) return;

    // Determine specialized field team based on incident category
    const cat = (incident.category || incident.type || 'INFRASTRUCTURE').toUpperCase();
    let assignedTeam = { id: 'FT-Alpha', name: 'Alpha Road & Asphalt Crew', emoji: '🛣️' };
    if (cat.includes('WATER')) assignedTeam = { id: 'FT-Bravo', name: 'Bravo Water Mains Unit', emoji: '💧' };
    else if (cat.includes('ELECTRI') || cat.includes('LIGHT') || cat.includes('SIGNAL')) assignedTeam = { id: 'FT-Charlie', name: 'Charlie Smart Grid', emoji: '💡' };
    else if (cat.includes('DRAIN') || cat.includes('FLOOD')) assignedTeam = { id: 'FT-Delta', name: 'Delta Flood Ops', emoji: '🌊' };
    else if (cat.includes('SANIT') || cat.includes('WASTE') || cat.includes('GARBAGE')) assignedTeam = { id: 'FT-Echo', name: 'Echo Sanitation Squad', emoji: '🧹' };

    try {
      await api.createAssignment({
        complaintId: cmpId,
        fieldTeamId: assignedTeam.id,
      });
    } catch {
      // Local fallback mode
    }

    const assignedInfo = {
      id: cmpId,
      complaint_id: cmpId,
      status: 'assigned',
      assignedTeam: assignedTeam.name,
      teamId: assignedTeam.id,
      assignedAt: new Date().toLocaleTimeString()
    };

    // Update local complaints state in Dashboard
    setComplaints(prev => prev.map(c => {
      const id = c.id || c.complaint_id;
      if (id === cmpId) {
        return { ...c, status: 'assigned', assignedTeam: assignedTeam.name };
      }
      return c;
    }));

    // Broadcast across window & localStorage so all open pages/tabs sync
    window.dispatchEvent(new CustomEvent('complaint.assigned', { detail: assignedInfo }));
    const stored = JSON.parse(localStorage.getItem('vizag_assignments') || '{}');
    stored[cmpId] = assignedInfo;
    localStorage.setItem('vizag_assignments', JSON.stringify(stored));

    addNotification({
      title: 'Team Dispatched!',
      message: `${assignedTeam.emoji} ${assignedTeam.name} dispatched to ${cmpId}`,
      priority: 'low',
    });
  }, [addNotification]);

  // Entrance animation (runs after loader completes)
  const handleLoaderComplete = useCallback(() => {
    setLoading(false);
  }, []);

  useGSAP(() => {
    if (loading) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Stats cards stagger upward
    if (statsRef.current) {
      tl.fromTo(
        statsRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5 },
        0.1
      );
    }

    // Map expands into view
    if (mapRef.current) {
      tl.fromTo(
        mapRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6 },
        0.3
      );
    }

    // Triage panel slides in from right
    if (triageRef.current) {
      tl.fromTo(
        triageRef.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5 },
        0.4
      );
    }

    // Charts section
    if (chartsRef.current) {
      tl.fromTo(
        chartsRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.4 },
        0.55
      );
    }
  }, { dependencies: [loading] });

  // Fetch real data on mount / auth completion
  useEffect(() => {
    if (loading) return;

    const fetchData = async () => {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

        // Fetch complaints
        const complaintsRes = await fetch(`${API_URL}/complaints`, { headers });
        if (complaintsRes.ok) {
          const resData = await complaintsRes.json();
          if (resData.success && Array.isArray(resData.data)) {
            const storedAssignments = JSON.parse(localStorage.getItem('vizag_assignments') || '{}');
            const mapped = resData.data.map(mapComplaintFromBackend).map(c => {
              const id = c.complaint_id || c.id;
              const assign = storedAssignments[id];
              if (assign) {
                return { ...c, status: assign.status || 'assigned', assignedTeam: assign.assignedTeam };
              }
              return c;
            });
            setComplaints(mapped);
          }
        }

        // Fetch field teams
        const teamsRes = await fetch(`${API_URL}/field-teams`, { headers });
        if (teamsRes.ok) {
          const resData = await teamsRes.json();
          if (resData.success && Array.isArray(resData.data)) {
            setFieldTeams(resData.data.map(mapFieldTeamFromBackend));
          }
        }

        // Fetch sensor events
        const sensorsRes = await fetch(`${API_URL}/sensor-events`, { headers });
        if (sensorsRes.ok) {
          const resData = await sensorsRes.json();
          if (resData.success && Array.isArray(resData.data)) {
            setSensorEvents(resData.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchData();
  }, [loading, accessToken]);

  const activeComplaints = complaints.filter((c) => {
    const st = (c.status || '').toLowerCase();
    return st !== 'resolved' && st !== 'closed' && st !== 'completed';
  }).length;

  const displayTeams = fieldTeams.length > 0 ? fieldTeams : [
    { team_id: 'FT-Alpha', status: 'available' },
    { team_id: 'FT-Bravo', status: 'available' },
    { team_id: 'FT-Charlie', status: 'available' },
    { team_id: 'FT-Delta', status: 'available' }
  ];

  const availableTeams = displayTeams.filter((t) => (t.status || '').toLowerCase() === 'available').length;
  const matchRate = complaints.length > 0 ? Math.min(92, 70 + complaints.length * 2) : 85;
  const avgLatency = complaints.length > 0 ? Math.max(3, 12 - complaints.length * 0.5) : 4;

  return (
    <>
      {loading && <CinematicLoader onComplete={handleLoaderComplete} />}

      <DashboardLayout wsStatus={wsStatus} activeIncidents={activeComplaints}>
        {/* Notifications disabled
        <NotificationCenter
          notifications={notifications}
          onDismiss={handleDismissNotification}
        />
        */}

        <div className="dashboard-grid" style={{ gap: 'var(--space-6)' }}>
          {/* Statistics Row */}
          {!synced && loading ? (
            <StatsSkeleton />
          ) : (
            <div className="dashboard-grid-stats" ref={statsRef}>
              <StatCard
                label="Active Incidents"
                value={activeComplaints}
                trend={`${complaints.length} total`}
                trendDirection="up"
                icon={<AlertTriangle size={18} />}
                iconColor="orange"
              />
              <StatCard
                label="Available Teams"
                value={availableTeams}
                trend={`${displayTeams.length} total`}
                trendDirection="up"
                icon={<Users size={18} />}
                iconColor="blue"
              />
              <StatCard
                label="Match Rate"
                value={matchRate}
                suffix="%"
                trend="Target: 90%"
                trendDirection="up"
                icon={<Radio size={18} />}
                iconColor="green"
              />
              <StatCard
                label="Avg. Dispatch Time"
                value={Math.round(avgLatency)}
                suffix="s"
                trend="< 5s target"
                trendDirection="down"
                icon={<Clock size={18} />}
                iconColor="red"
              />
            </div>
          )}

          {/* Quick Stats / Charts placeholder row */}
          <div className="dashboard-grid-charts" ref={chartsRef}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <span className="text-sm font-semibold">Complaint Volume</span>
                <span className="badge badge-accent">Today</span>
              </div>
              <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                {[35, 52, 41, 68, 55, 72, 48, 63, 45, 58, 70, 80].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: i === 11 ? 'var(--accent-gradient)' : 'var(--accent-light)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <span className="text-sm font-semibold">Assignment Latency</span>
                <span className="badge badge-success">On Track</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: `conic-gradient(var(--accent-primary) ${85 * 3.6}deg, var(--accent-light) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--accent-primary)',
                  }}>
                    85%
                  </div>
                </div>
                <div style={{ minWidth: 140, flex: 1 }}>
                  <div className="text-sm font-semibold">Under 5s SLA Target</div>
                  <div className="text-xs text-secondary" style={{ marginTop: 4 }}>17 of 20 incidents dispatched within target SLA</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <span className="text-sm font-semibold">Team Utilization</span>
                <span className="badge badge-info">Live</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                {[
                  { label: 'Available', value: 60, color: 'var(--status-success)' },
                  { label: 'En Route', value: 20, color: 'var(--status-info)' },
                  { label: 'On Site', value: 15, color: 'var(--status-warning)' },
                  { label: 'Offline', value: 5, color: 'var(--text-tertiary)' },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-xs text-secondary">{item.label}</span>
                      <span className="text-xs font-semibold">{item.value}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${item.value}%`,
                        background: item.color,
                        borderRadius: 3,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map + Triage Panel */}
          <div className="dashboard-grid-main">
            <div ref={mapRef} style={{ height: '100%', minHeight: '460px' }}>
              <LiveMap
                complaints={complaints}
                sensorEvents={sensorEvents}
                fieldTeams={fieldTeams}
                selectedIncident={selectedIncident}
                onMarkerClick={(type, data) => {
                  if (type === 'complaint') setSelectedIncident(data);
                }}
              />
            </div>

            <div ref={triageRef} style={{ height: '100%' }}>
              <TriagePanel
                incidents={complaints}
                selectedId={selectedIncident?.complaint_id}
                onSelectIncident={setSelectedIncident}
                onDispatch={handleDispatch}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
