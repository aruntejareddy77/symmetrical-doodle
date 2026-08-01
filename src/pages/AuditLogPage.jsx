import { useState, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ClipboardList, Search, Filter, Clock, ChevronLeft,
  ChevronRight, User, MapPin, AlertTriangle, Send,
  CheckCircle2, Eye, Edit, Trash2,
} from 'lucide-react';

import DashboardLayout from '../components/Layout/DashboardLayout';

gsap.registerPlugin(useGSAP);

const ACTION_CONFIG = {
  create: { color: 'var(--status-success)', icon: CheckCircle2, label: 'Created' },
  update: { color: 'var(--status-info)', icon: Edit, label: 'Updated' },
  dispatch: { color: 'var(--status-warning)', icon: Send, label: 'Dispatched' },
  resolve: { color: 'var(--status-success)', icon: CheckCircle2, label: 'Resolved' },
  view: { color: 'var(--text-tertiary)', icon: Eye, label: 'Viewed' },
  delete: { color: 'var(--status-danger)', icon: Trash2, label: 'Deleted' },
  assign: { color: 'var(--accent-primary)', icon: Send, label: 'Assigned' },
};

const ENTITY_TYPES = ['complaint', 'sensor_event', 'field_team', 'assignment', 'user'];
const ACTIONS = ['create', 'update', 'dispatch', 'resolve', 'assign', 'view'];
const ACTORS = ['Priya Sharma', 'Ravi Kumar', 'System', 'API Gateway', 'Match Engine', 'Operator Console'];

function generateMockLogs(count = 100) {
  const logs = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const entity = ENTITY_TYPES[Math.floor(Math.random() * ENTITY_TYPES.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const actor = ACTORS[Math.floor(Math.random() * ACTORS.length)];
    const ts = new Date(now - i * (60000 + Math.random() * 300000));

    logs.push({
      id: `AUD-${String(count - i).padStart(4, '0')}`,
      entity_type: entity,
      entity_id: `${entity.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      action,
      actor,
      timestamp: ts.toISOString(),
      details: generateDetail(entity, action),
    });
  }
  return logs;
}

function generateDetail(entity, action) {
  const details = {
    complaint: {
      create: 'New complaint filed via citizen portal',
      update: 'Status changed to in-progress',
      dispatch: 'Team dispatched to complaint location',
      resolve: 'Complaint marked as resolved',
      assign: 'Auto-assigned to nearest team',
      view: 'Complaint details viewed',
    },
    sensor_event: {
      create: 'Sensor event ingested from COC feed',
      update: 'Confidence score updated',
      dispatch: 'Alert generated from sensor event',
      resolve: 'Sensor alert acknowledged',
      assign: 'Matched with nearby complaint',
      view: 'Sensor event details viewed',
    },
    field_team: {
      create: 'Team registered in system',
      update: 'Status/location updated',
      dispatch: 'Team dispatched to incident',
      resolve: 'Team returned to available',
      assign: 'Assignment accepted',
      view: 'Team profile viewed',
    },
    assignment: {
      create: 'New assignment created',
      update: 'ETA recalculated',
      dispatch: 'Dispatch notification sent',
      resolve: 'Assignment completed',
      assign: 'Team confirmed dispatch',
      view: 'Assignment details viewed',
    },
    user: {
      create: 'User account created',
      update: 'Profile updated',
      view: 'User logged in',
      resolve: 'Session ended',
      dispatch: 'Notification sent',
      assign: 'Role assigned',
    },
  };
  return details[entity]?.[action] || 'Action performed';
}

const PAGE_SIZE = 15;

export default function AuditLogPage() {
  const [logs] = useState(() => generateMockLogs(100));
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef(null);

  // Entrance animation
  useGSAP(() => {
    if (tableRef.current) {
      gsap.fromTo(
        tableRef.current.querySelectorAll('.audit-row'),
        { x: -15, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.02, duration: 0.3, ease: 'power3.out' }
      );
    }
  }, { dependencies: [currentPage, entityFilter, actionFilter] });

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesSearch && matchesEntity && matchesAction;
    });
  }, [logs, searchQuery, entityFilter, actionFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">
              <ClipboardList size={22} />
              Audit Log
            </h2>
            <p className="page-subtitle">{filtered.length} entries · Every state change tracked</p>
          </div>
          <div className="page-header-right">
            <div className="page-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="audit-filters">
          <div className="audit-filter-group">
            <label>Entity</label>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
              className="sensor-select"
            >
              <option value="all">All Entities</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="audit-filter-group">
            <label>Action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="sensor-select"
            >
              <option value="all">All Actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Log Table */}
        <div className="audit-table-wrapper" ref={tableRef}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Details</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((log) => {
                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
                const ActionIcon = config.icon;
                return (
                  <tr key={log.id} className="audit-row">
                    <td className="audit-timestamp">
                      <Clock size={12} />
                      <span>
                        {new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' '}
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <span className="audit-action-badge" style={{ '--action-color': config.color }}>
                        <ActionIcon size={12} />
                        {config.label}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-accent">{log.entity_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="font-mono text-xs">{log.entity_id}</td>
                    <td className="text-sm text-secondary">{log.details}</td>
                    <td>
                      <div className="audit-actor">
                        <User size={12} />
                        <span>{log.actor}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paged.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={28} /></div>
              <div className="empty-state-title">No log entries found</div>
              <div className="empty-state-desc">Try adjusting your search or filter criteria.</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="audit-pagination">
            <button
              className="pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
