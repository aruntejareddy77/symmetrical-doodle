import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Filter, X, Layers, Eye, EyeOff, MapPin,
  AlertTriangle, Radio, Users, Clock, ChevronRight,
} from 'lucide-react';

import DashboardLayout from '../components/Layout/DashboardLayout';
import LiveMap from '../components/Map/LiveMap';
import useWebSocket, { VIZAG_LOCATIONS } from '../hooks/useWebSocket';

gsap.registerPlugin(useGSAP);

const COMPLAINT_TYPES = ['pothole', 'road_obstruction', 'waterlogging', 'streetlight'];
const TEAM_STATUSES = ['available', 'en_route', 'on_site', 'done'];

export default function LiveMapPage() {
  const [complaints, setComplaints] = useState([]);
  const [sensorEvents, setSensorEvents] = useState([]);
  const [fieldTeams, setFieldTeams] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [activeComplaintTypes, setActiveComplaintTypes] = useState(new Set(COMPLAINT_TYPES));
  const [activeTeamStatuses, setActiveTeamStatuses] = useState(new Set(TEAM_STATUSES));
  const [showComplaints, setShowComplaints] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showTeams, setShowTeams] = useState(true);

  const drawerRef = useRef(null);
  const filterPanelRef = useRef(null);

  const handleWsMessage = useCallback((event) => {
    switch (event.type) {
      case 'complaint.new':
        setComplaints((prev) => [event.data, ...prev.slice(0, 99)]);
        break;
      case 'sensor.new':
        setSensorEvents((prev) => [event.data, ...prev.slice(0, 99)]);
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
      default:
        break;
    }
  }, []);

  const { status: wsStatus } = useWebSocket('ws://localhost:3000/ws', {
    onMessage: handleWsMessage,
    mockMode: true,
  });

  // Generate initial field teams
  useEffect(() => {
    setFieldTeams(
      Array.from({ length: 8 }, (_, i) => {
        const base = VIZAG_LOCATIONS[Math.floor(Math.random() * VIZAG_LOCATIONS.length)];
        return {
          team_id: `FT-0${i + 1}`,
          status: ['available', 'en_route', 'on_site'][Math.floor(Math.random() * 3)],
          location: {
            lat: base.lat + (Math.random() - 0.5) * 0.005,
            lng: base.lng + (Math.random() - 0.5) * 0.005,
          },
          updated_at: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Drawer animation
  useEffect(() => {
    if (drawerRef.current) {
      if (drawerOpen && selectedIncident) {
        gsap.fromTo(drawerRef.current, { x: 420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
      }
    }
  }, [drawerOpen, selectedIncident]);

  const handleMarkerClick = useCallback((type, data) => {
    if (type === 'complaint') {
      setSelectedIncident(data);
      setDrawerOpen(true);
    }
  }, []);

  const toggleComplaintType = (type) => {
    setActiveComplaintTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const toggleTeamStatus = (status) => {
    setActiveTeamStatuses((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const filteredComplaints = showComplaints
    ? complaints.filter((c) => activeComplaintTypes.has(c.type))
    : [];
  const filteredSensors = showSensors ? sensorEvents : [];
  const filteredTeams = showTeams
    ? fieldTeams.filter((t) => activeTeamStatuses.has(t.status))
    : [];

  const statusColor = {
    available: 'var(--status-success)',
    en_route: 'var(--status-info)',
    on_site: 'var(--status-warning)',
    done: 'var(--text-tertiary)',
  };

  return (
    <DashboardLayout wsStatus={wsStatus}>
      <div className="livemap-page">
        {/* Toolbar */}
        <div className="livemap-toolbar">
          <div className="livemap-toolbar-left">
            <h2 className="livemap-title">
              <MapPin size={20} />
              Live Operations Map
            </h2>
            <div className="livemap-stats">
              <span className="badge badge-danger">{complaints.length} Complaints</span>
              <span className="badge badge-warning">{sensorEvents.length} Sensors</span>
              <span className="badge badge-info">{fieldTeams.length} Teams</span>
            </div>
          </div>
          <div className="livemap-toolbar-right">
            <button
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="livemap-filter-panel" ref={filterPanelRef}>
            <div className="filter-section">
              <div className="filter-section-title">
                <button
                  className={`filter-toggle ${showComplaints ? 'active' : ''}`}
                  onClick={() => setShowComplaints(!showComplaints)}
                >
                  {showComplaints ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span>Complaints</span>
              </div>
              <div className="filter-chips">
                {COMPLAINT_TYPES.map((type) => (
                  <button
                    key={type}
                    className={`filter-chip ${activeComplaintTypes.has(type) ? 'active' : ''}`}
                    onClick={() => toggleComplaintType(type)}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">
                <button
                  className={`filter-toggle ${showSensors ? 'active' : ''}`}
                  onClick={() => setShowSensors(!showSensors)}
                >
                  {showSensors ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span>Sensor Events</span>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">
                <button
                  className={`filter-toggle ${showTeams ? 'active' : ''}`}
                  onClick={() => setShowTeams(!showTeams)}
                >
                  {showTeams ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span>Field Teams</span>
              </div>
              <div className="filter-chips">
                {TEAM_STATUSES.map((status) => (
                  <button
                    key={status}
                    className={`filter-chip ${activeTeamStatuses.has(status) ? 'active' : ''}`}
                    onClick={() => toggleTeamStatus(status)}
                    style={{ '--chip-color': statusColor[status] }}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="livemap-map-wrapper">
          <LiveMap
            complaints={filteredComplaints}
            sensorEvents={filteredSensors}
            fieldTeams={filteredTeams}
            selectedIncident={selectedIncident}
            onMarkerClick={handleMarkerClick}
          />

          {/* Incident Drawer */}
          {drawerOpen && selectedIncident && (
            <div className="livemap-drawer" ref={drawerRef}>
              <div className="livemap-drawer-header">
                <h3>Incident Details</h3>
                <button className="livemap-drawer-close" onClick={() => { setDrawerOpen(false); setSelectedIncident(null); }}>
                  <X size={18} />
                </button>
              </div>
              <div className="livemap-drawer-body">
                <div className="drawer-field">
                  <span className="drawer-field-label">ID</span>
                  <span className="drawer-field-value font-mono">{selectedIncident.complaint_id}</span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-field-label">Type</span>
                  <span className="badge badge-danger">{selectedIncident.type?.replace('_', ' ')}</span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-field-label">Description</span>
                  <span className="drawer-field-value">{selectedIncident.description || 'No description'}</span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-field-label">Location</span>
                  <span className="drawer-field-value text-xs">
                    {selectedIncident.location?.lat?.toFixed(4)}, {selectedIncident.location?.lng?.toFixed(4)}
                  </span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-field-label">Status</span>
                  <span className={`badge ${selectedIncident.status === 'assigned' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedIncident.status}
                  </span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-field-label">Reported</span>
                  <span className="drawer-field-value text-xs">
                    {selectedIncident.reported_at
                      ? new Date(selectedIncident.reported_at).toLocaleString('en-IN')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
