import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Settings as SettingsIcon, User, MapPin, Radio, Bell,
  Globe, Shield, Database, Download, Save,
  ChevronRight, Check, Moon, Sun, Monitor,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import DashboardLayout from '../components/Layout/DashboardLayout';

gsap.registerPlugin(useGSAP);

const DEFAULT_SETTINGS = {
  // General
  wardId: 'GVMC-W12',
  operatorName: 'Priya Sharma',
  operatorRole: 'Triage Officer',

  // Matching Engine
  matchRadius: 150,
  matchTimeWindow: 30,
  autoMatch: true,
  autoDispatch: false,

  // Notifications
  notifyWebSocket: true,
  notifySMS: false,
  notifyEmail: false,
  notifySound: true,

  // System
  apiEndpoint: 'https://vizagops-api.onrender.com/api/v1',
  wsEndpoint: 'wss://vizagops-api.onrender.com/ws',
  theme: 'light',
  dataRetention: 30,
};

function loadSettings() {
  try {
    const stored = localStorage.getItem('vizagops_settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings);
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);
  const contentRef = useRef(null);
  const { user } = useAuth();

  // Entrance animation
  useGSAP(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current.querySelectorAll('.settings-field'),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.04, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, { dependencies: [activeSection] });

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('vizagops_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vizagops-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sections = [
    { key: 'general', label: 'General', icon: User },
    { key: 'matching', label: 'Matching Engine', icon: Radio },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'system', label: 'System', icon: Globe },
  ];

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">
              <SettingsIcon size={22} />
              Settings
            </h2>
            <p className="page-subtitle">Configure system parameters and preferences</p>
          </div>
          <div className="page-header-right">
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={16} />
              Export
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="settings-layout">
          {/* Sidebar Navigation */}
          <div className="settings-sidebar">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  className={`settings-nav-item ${activeSection === section.key ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.key)}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                  <ChevronRight size={14} className="settings-nav-arrow" />
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="settings-content" ref={contentRef}>
            {activeSection === 'general' && (
              <>
                <h3 className="settings-section-title">General Configuration</h3>

                <div className="settings-field">
                  <label className="settings-label">Operator Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.operatorName}
                    onChange={(e) => update('operatorName', e.target.value)}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Operator Role</label>
                  <select
                    className="settings-input"
                    value={settings.operatorRole}
                    onChange={(e) => update('operatorRole', e.target.value)}
                  >
                    <option>Triage Officer</option>
                    <option>Supervisor</option>
                    <option>Administrator</option>
                    <option>Field Coordinator</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Pilot Ward</label>
                  <div className="settings-input-group">
                    <MapPin size={16} />
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.wardId}
                      onChange={(e) => update('wardId', e.target.value)}
                    />
                  </div>
                  <span className="settings-hint">The designated ward for the pilot deployment</span>
                </div>

                <div className="settings-field">
                  <label className="settings-label">User Info</label>
                  <div className="settings-user-card">
                    <div className="settings-user-avatar">
                      {(user?.name || 'PS').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{user?.name || 'Priya Sharma'}</div>
                      <div className="text-xs text-secondary">{user?.email || 'priya@gvmc.gov.in'}</div>
                      <div className="text-xs text-tertiary">{user?.role || 'admin'}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'matching' && (
              <>
                <h3 className="settings-section-title">Matching Engine Configuration</h3>

                <div className="settings-field">
                  <label className="settings-label">
                    Match Radius: <strong>{settings.matchRadius}m</strong>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={settings.matchRadius}
                    onChange={(e) => update('matchRadius', Number(e.target.value))}
                    className="settings-slider"
                  />
                  <div className="settings-range-labels">
                    <span>50m</span>
                    <span>500m</span>
                  </div>
                  <span className="settings-hint">
                    Geospatial radius for matching complaints with nearby sensor events
                  </span>
                </div>

                <div className="settings-field">
                  <label className="settings-label">
                    Time Window: <strong>{settings.matchTimeWindow} min</strong>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={settings.matchTimeWindow}
                    onChange={(e) => update('matchTimeWindow', Number(e.target.value))}
                    className="settings-slider"
                  />
                  <div className="settings-range-labels">
                    <span>5 min</span>
                    <span>120 min</span>
                  </div>
                  <span className="settings-hint">
                    Maximum time delta between complaint and sensor event for automatic matching
                  </span>
                </div>

                <div className="settings-field">
                  <div className="settings-toggle-row">
                    <div>
                      <label className="settings-label">Auto-Match</label>
                      <span className="settings-hint">Automatically correlate complaints with sensor events</span>
                    </div>
                    <button
                      className={`toggle-switch ${settings.autoMatch ? 'active' : ''}`}
                      onClick={() => update('autoMatch', !settings.autoMatch)}
                    >
                      <div className="toggle-knob" />
                    </button>
                  </div>
                </div>

                <div className="settings-field">
                  <div className="settings-toggle-row">
                    <div>
                      <label className="settings-label">Auto-Dispatch</label>
                      <span className="settings-hint">Automatically dispatch nearest available team on match</span>
                    </div>
                    <button
                      className={`toggle-switch ${settings.autoDispatch ? 'active' : ''}`}
                      onClick={() => update('autoDispatch', !settings.autoDispatch)}
                    >
                      <div className="toggle-knob" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'notifications' && (
              <>
                <h3 className="settings-section-title">Notification Preferences</h3>

                {[
                  { key: 'notifyWebSocket', label: 'WebSocket Push', desc: 'Real-time dashboard notifications via WebSocket', icon: Globe },
                  { key: 'notifySMS', label: 'SMS Alerts', desc: 'Send SMS notifications to field teams (requires SMS gateway)', icon: Bell },
                  { key: 'notifyEmail', label: 'Email Digest', desc: 'Daily summary email of operations', icon: Bell },
                  { key: 'notifySound', label: 'Sound Alerts', desc: 'Play audio notification on new incidents', icon: Bell },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div className="settings-field" key={key}>
                    <div className="settings-toggle-row">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                        <div className="settings-toggle-icon">
                          <Icon size={18} />
                        </div>
                        <div>
                          <label className="settings-label">{label}</label>
                          <span className="settings-hint">{desc}</span>
                        </div>
                      </div>
                      <button
                        className={`toggle-switch ${settings[key] ? 'active' : ''}`}
                        onClick={() => update(key, !settings[key])}
                      >
                        <div className="toggle-knob" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeSection === 'system' && (
              <>
                <h3 className="settings-section-title">System Configuration</h3>

                <div className="settings-field">
                  <label className="settings-label">API Endpoint</label>
                  <div className="settings-input-group">
                    <Globe size={16} />
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.apiEndpoint}
                      onChange={(e) => update('apiEndpoint', e.target.value)}
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">WebSocket Endpoint</label>
                  <div className="settings-input-group">
                    <Radio size={16} />
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.wsEndpoint}
                      onChange={(e) => update('wsEndpoint', e.target.value)}
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">
                    Data Retention: <strong>{settings.dataRetention} days</strong>
                  </label>
                  <input
                    type="range"
                    min={7}
                    max={90}
                    step={1}
                    value={settings.dataRetention}
                    onChange={(e) => update('dataRetention', Number(e.target.value))}
                    className="settings-slider"
                  />
                  <div className="settings-range-labels">
                    <span>7 days</span>
                    <span>90 days</span>
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Theme</label>
                  <div className="theme-selector">
                    {[
                      { key: 'light', label: 'Light', icon: Sun },
                      { key: 'system', label: 'System', icon: Monitor },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        className={`theme-option ${settings.theme === key ? 'active' : ''}`}
                        onClick={() => update('theme', key)}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">System Info</label>
                  <div className="settings-info-grid">
                    <div className="settings-info-item">
                      <span className="text-xs text-tertiary">Version</span>
                      <span className="text-sm font-semibold">v1.0.0-pilot</span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-xs text-tertiary">Environment</span>
                      <span className="text-sm font-semibold">Production</span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-xs text-tertiary">Database</span>
                      <span className="text-sm font-semibold">PostgreSQL</span>
                    </div>
                    <div className="settings-info-item">
                      <span className="text-xs text-tertiary">Runtime</span>
                      <span className="text-sm font-semibold">Node.js 24</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
