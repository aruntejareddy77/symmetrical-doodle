import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { MapPin, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import IncidentTimeline from './IncidentTimeline';
import { DispatchButton, StatusButton } from '../UI/Buttons';
import { NoComplaints } from '../UI/EmptyStates';

/**
 * TriagePanel — Real-time incident feed panel.
 * New incidents animate in via GSAP (no ScrollTrigger on primary dashboard).
 */
export default function TriagePanel({ incidents = [], onSelectIncident, onDispatch, selectedId }) {
  const listRef = useRef(null);
  const animatedIdsRef = useRef(new Set());

  // Animate new cards sliding in
  useEffect(() => {
    incidents.forEach((incident) => {
      if (animatedIdsRef.current.has(incident.complaint_id)) return;
      animatedIdsRef.current.add(incident.complaint_id);

      // Find the DOM element
      const el = document.getElementById(`incident-${incident.complaint_id}`);
      if (!el) return;

      gsap.fromTo(el,
        { opacity: 0, y: -20, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: 'power3.out',
        }
      );
    });
  }, [incidents]);

  const handleHighlight = useCallback((id) => {
    const el = document.getElementById(`incident-${id}`);
    if (!el) return;

    // Temporary orange glow
    gsap.fromTo(el,
      { boxShadow: '0 0 0 2px var(--accent-light), 0 4px 14px rgba(255, 107, 0, 0.15)' },
      {
        boxShadow: '0 0 0 0px transparent, 0 1px 3px rgba(0,0,0,0.06)',
        duration: 2,
        ease: 'power2.out',
        delay: 1.5,
      }
    );
  }, []);

  const getPriorityBadge = (priority) => {
    const classes = {
      high: 'badge-danger',
      medium: 'badge-warning',
      low: 'badge-info',
    };
    return <span className={`badge ${classes[priority] || 'badge-accent'}`}>{priority}</span>;
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'assigned') return <span className="badge badge-info font-extrabold bg-blue-500/20 text-blue-800">ASSIGNED</span>;
    if (s === 'in_progress' || s === 'in-progress') return <span className="badge badge-success font-extrabold bg-green-500/20 text-green-800">IN PROGRESS</span>;
    if (s === 'resolved') return <span className="badge badge-success font-extrabold bg-green-600/20 text-green-900">RESOLVED</span>;
    return <span className="badge badge-accent font-extrabold">{s.toUpperCase() || 'PENDING'}</span>;
  };

  const getTimeSince = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  if (incidents.length === 0) {
    return (
      <div className="triage-panel">
        <div className="triage-panel-header">
          <h2 className="triage-panel-title">Incident Feed</h2>
        </div>
        <NoComplaints />
      </div>
    );
  }

  return (
    <div className="triage-panel">
      <div className="triage-panel-header">
        <h2 className="triage-panel-title">Incident Feed</h2>
        <span className="triage-panel-count">{incidents.length} active</span>
      </div>

      <div className="triage-panel-list" ref={listRef}>
        {incidents.map((incident) => {
          const isSelected = selectedId === incident.complaint_id || selectedId === incident.id;
          const status = (incident.status || '').toLowerCase();
          const isPending = status === 'received' || status === 'pending' || status === 'open';
          const isAssigned = status === 'assigned' || status === 'in_progress' || status === 'in-progress';

          return (
            <div
              key={incident.complaint_id || incident.id}
              id={`incident-${incident.complaint_id || incident.id}`}
              className={`incident-card ${isSelected ? 'highlight' : ''}`}
              onClick={() => {
                onSelectIncident?.(incident);
                handleHighlight(incident.complaint_id || incident.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="incident-card-header">
                <div>
                  <span className="incident-card-id">{incident.complaint_id || incident.id}</span>
                  <div className="incident-card-type">{(incident.category || incident.type || 'INFRASTRUCTURE').replace('_', ' ')}</div>
                </div>
                {getStatusBadge(incident.status)}
              </div>

              <p className="incident-card-desc">{incident.description || incident.title}</p>

              {isSelected && (
                <IncidentTimeline currentStep={incident.status} />
              )}

              <div className="incident-card-footer">
                <div className="incident-card-meta">
                  <MapPin size={12} />
                  <span>{(incident.latitude || incident.location?.lat || 17.6868).toFixed(4)}, {(incident.longitude || incident.location?.lng || 83.2185).toFixed(4)}</span>
                </div>
                <div className="incident-card-meta">
                  <Clock size={12} />
                  <span>{getTimeSince(incident.reported_at || incident.createdAt)}</span>
                </div>
              </div>

              {isSelected && isPending && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <DispatchButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onDispatch?.(incident);
                    }}
                  >
                    Dispatch Nearest Team <ChevronRight size={16} />
                  </DispatchButton>
                </div>
              )}

              {isSelected && isAssigned && (
                <div style={{ marginTop: 'var(--space-3)', padding: '8px 12px', background: 'rgba(37,99,235,0.15)', borderRadius: '10px', border: '1px solid rgba(37,99,235,0.3)', color: '#1e40af', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>✅ Assigned to {incident.assignedTeam || incident.assigned_team_id || 'Field Response Unit'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
