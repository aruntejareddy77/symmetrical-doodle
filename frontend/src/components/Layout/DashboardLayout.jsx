import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, FileText, BarChart3, ClipboardList,
  Settings, Users, Radio, Bell, Search, ChevronLeft,
  Shield, Clock, Wifi, WifiOff, Activity, User, Menu,
} from 'lucide-react';
import { IconButton } from '../UI/Buttons';

/**
 * DashboardLayout — Reusable shell component containing:
 *  - Sidebar (navigation)
 *  - Top Navigation
 *  - Command Center Header (system health statuses)
 *  - Notification Center trigger
 *  - Command Bar (search)
 *  - Main Content
 *  - Footer
 */
export default function DashboardLayout({ children, wsStatus = 'connected', activeIncidents = 0 }) {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="dashboard-layout">
      {/* === Sidebar === */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo cursor-pointer" onClick={() => navigate('/')}>
          <div className="sidebar-logo-icon">V</div>
          {!sidebarCollapsed && (
            <div className="sidebar-logo-text">
              Vizag<span>Ops</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-section-label">Operations</div>

          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} className="sidebar-link-icon" />
            {!sidebarCollapsed && 'Dashboard'}
            {!sidebarCollapsed && activeIncidents > 0 && (
              <span className="sidebar-link-badge">{activeIncidents}</span>
            )}
          </NavLink>

          <NavLink to="/map" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Map size={20} className="sidebar-link-icon" />
            {!sidebarCollapsed && 'Live Map'}
          </NavLink>

          <NavLink to="/field-teams" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={20} className="sidebar-link-icon" />
            {!sidebarCollapsed && 'Field Teams'}
          </NavLink>

          <NavLink to="/sensors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Radio size={20} className="sidebar-link-icon" />
            {!sidebarCollapsed && 'Sensor Feeds'}
          </NavLink>

          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-4)' }}>Analytics</div>

          <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <BarChart3 size={20} className="sidebar-link-icon" />
            {!sidebarCollapsed && 'Analytics'}
          </NavLink>

          <NavLink to="/audit-log" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ClipboardList size={20} className="sidebar-link-icon" />
            {!sidebarCollapsed && 'Audit Log'}
          </NavLink>

          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-4)' }}>System</div>

          <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Settings size={20} className="sidebar-link-icon" />
            {!sidebarCollapsed && 'Settings'}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-link"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={20}
              className="sidebar-link-icon"
              style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
            />
            {!sidebarCollapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* === Main Area === */}
      <div className="dashboard-main">
        {/* Command Center Header */}
        <div className="command-header" role="status" aria-label="System status bar">
          <div className="command-header-item">
            <Shield size={12} />
            <span>Ward: GVMC-W12</span>
          </div>
          <div className="command-header-separator" />

          <div className="command-header-item">
            <span className={`command-header-dot ${wsStatus === 'connected' ? 'online' : wsStatus === 'connecting' ? 'warning' : 'offline'}`} />
            <span>WebSocket: {wsStatus}</span>
          </div>
          <div className="command-header-separator" />

          <div className="command-header-item">
            <span className="command-header-dot online" />
            <span>Sensor Feed: Active</span>
          </div>
          <div className="command-header-separator" />

          <div className="command-header-item">
            <span className="command-header-dot online" />
            <span>GPS Feed: Active</span>
          </div>
          <div className="command-header-separator" />

          <div className="command-header-item">
            <span className="command-header-dot online" />
            <span>Match Engine: Running</span>
          </div>
          <div className="command-header-separator" />

          <div className="command-header-item">
            <Activity size={12} />
            <span>System Health: Nominal</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="command-header-item">
              <Clock size={12} />
              <span>{timeStr} IST</span>
            </div>
            <div className="command-header-separator" />
            <div className="command-header-item">
              <User size={12} />
              <span>Operator: Priya S.</span>
            </div>
          </div>
        </div>

        {/* Top Navigation */}
        <header className="top-header">
          <div className="top-header-left">
            <IconButton
              icon={Menu}
              label="Toggle mobile menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-menu-btn"
              style={{ display: 'none' }}
            />
            <h1 className="top-header-title">Unified Operations Center</h1>
          </div>

          <div className="top-header-right">
            {/* Command Bar */}
            <div className="command-bar">
              <Search size={16} color="var(--text-tertiary)" />
              <input type="text" placeholder="Search incidents, teams, sensors..." aria-label="Search" />
              <span className="command-bar-shortcut">⌘K</span>
            </div>

            <IconButton icon={Bell} label="Notifications" />
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fefae0', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>
              PS
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="dashboard-content" role="main">
          {children}
        </main>

        {/* Footer */}
        <footer className="dashboard-footer">
          <span>VizagOps Unify v1.0 — GVMC/GVSCCL Pilot</span>
          <span>{dateStr}</span>
        </footer>
      </div>
    </div>
  );
}
