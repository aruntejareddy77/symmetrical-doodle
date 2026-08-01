import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, FileText, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Plus, ArrowLeft, Send, Eye, X, Loader2,
  User, LogOut, Phone, Star, RefreshCw, Camera, Image as ImageIcon,
  Trash2, Navigation, Upload, Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/* ── Status Color & Label Mapping ──────────────────────────── */
const STATUS_CONFIG = {
  PENDING: { label: 'Received', color: '#dda15e', bg: 'rgba(221,161,94,0.12)', icon: Clock },
  OPEN: { label: 'Under Review', color: '#606c38', bg: 'rgba(96,108,56,0.10)', icon: Eye },
  ASSIGNED: { label: 'Team Assigned', color: '#2563eb', bg: 'rgba(37,99,235,0.10)', icon: CheckCircle },
  IN_PROGRESS: { label: 'In Progress', color: '#bc6c25', bg: 'rgba(188,108,37,0.12)', icon: Loader2 },
  RESOLVED: { label: 'Resolved', color: '#16a34a', bg: 'rgba(22,163,74,0.10)', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: '#6b7280', bg: 'rgba(107,114,128,0.10)', icon: X },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: X },
};

/* ── Category Options ──────────────────────────────────────── */
const CATEGORIES = [
  { value: 'INFRASTRUCTURE', label: 'Potholes / Roads', emoji: '🛣️' },
  { value: 'ELECTRICAL', label: 'Streetlights', emoji: '💡' },
  { value: 'WATER_SUPPLY', label: 'Water Supply', emoji: '💧' },
  { value: 'DRAINAGE', label: 'Drainage', emoji: '🌊' },
  { value: 'SANITATION', label: 'Sanitation', emoji: '🧹' },
  { value: 'GENERAL', label: 'Other', emoji: '📋' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: '#6b7280' },
  { value: 'MEDIUM', label: 'Medium', color: '#dda15e' },
  { value: 'HIGH', label: 'High', color: '#bc6c25' },
];

/* ══════════════════════════════════════════════════════════════
   CITIZEN PORTAL PAGE
   ══════════════════════════════════════════════════════════════ */
export default function CitizenPortal() {
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState('list');          // list | new | detail
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // New complaint form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'INFRASTRUCTURE',
    priority: 'MEDIUM',
    address: '',
    attachment: null,
    latitude: 17.6868,
    longitude: 83.2185,
  });

  /* ── GPS Geolocation Handler with Automatic Fallback ─────── */
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setForm(prev => ({ ...prev, latitude: 17.6868, longitude: 83.2185, address: prev.address || 'Siripuram Junction' }));
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
          address: prev.address || 'Detected GPS Location'
        }));
        setLocationLoading(false);
      },
      (error) => {
        console.warn('GPS detection unavailable or blocked:', error);
        setForm(prev => ({
          ...prev,
          latitude: 17.6868,
          longitude: 83.2185,
          address: prev.address || 'Siripuram Junction (Default)'
        }));
        setLocationLoading(false);
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  /* ── Image Upload & Preview Handler ───────────────────────── */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        attachment: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  /* ── Fetch Complaints ─────────────────────────────────────── */
  const fetchComplaints = useCallback(async () => {
    try {
      setRefreshing(true);
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await fetch(`${API_URL}/complaints`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const storedAssignments = JSON.parse(localStorage.getItem('vizag_assignments') || '{}');
          const merged = data.data.map(c => {
            const id = c.id || c.complaint_id;
            const assign = storedAssignments[id];
            if (assign) {
              return { ...c, status: assign.status || 'ASSIGNED', assignedTeam: assign.assignedTeam };
            }
            return c;
          });
          setComplaints(merged);
        }
      }
    } catch (e) {
      console.error('Error fetching complaints from PostgreSQL:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    const handleAssigned = (e) => {
      const detail = e.detail;
      if (!detail) return;
      setComplaints(prev => prev.map(c => {
        const id = c.id || c.complaint_id;
        if (id === detail.id || id === detail.complaint_id) {
          return { ...c, status: 'ASSIGNED', assignedTeam: detail.assignedTeam || detail.teamId };
        }
        return c;
      }));
    };

    window.addEventListener('complaint.assigned', handleAssigned);
    window.addEventListener('storage', fetchComplaints);
    return () => {
      window.removeEventListener('complaint.assigned', handleAssigned);
      window.removeEventListener('storage', fetchComplaints);
    };
  }, [fetchComplaints]);

  /* ── Submit New Complaint ─────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      };

      const payload = {
        title: form.title.trim(),
        description: form.description || '',
        category: form.category || 'INFRASTRUCTURE',
        priority: form.priority || 'MEDIUM',
        ward: form.address ? `Near ${form.address}` : 'GVMC-W12',
        latitude: typeof form.latitude === 'number' && !isNaN(form.latitude) ? form.latitude : 17.6868,
        longitude: typeof form.longitude === 'number' && !isNaN(form.longitude) ? form.longitude : 83.2185,
      };

      const res = await fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setComplaints(prev => [data.data, ...prev]);
        }
      }

      const resetForm = { title: '', description: '', category: 'INFRASTRUCTURE', priority: 'MEDIUM', address: '', attachment: null, latitude: 17.6868, longitude: 83.2185 };
      setForm(resetForm);
      setView('list');
    } catch (err) {
      console.error('Error submitting complaint to PostgreSQL:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Status Badge Component ──────────────────────────────── */
  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: 999,
        background: cfg.bg, color: cfg.color,
        fontSize: '0.75rem', fontWeight: 600,
      }}>
        <Icon size={12} />
        {cfg.label}
      </span>
    );
  };

  /* ── Timeline Step ───────────────────────────────────────── */
  const TimelineStep = ({ label, active, completed, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: completed ? '#16a34a' : active ? '#dda15e' : '#e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {completed && <CheckCircle size={12} color="#fff" />}
        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <span style={{
        fontSize: '0.8rem',
        fontWeight: active ? 700 : 400,
        color: active ? '#283618' : completed ? '#16a34a' : '#9ca3af',
      }}>{label}</span>
      {!last && <div style={{ flex: 1, height: 2, background: completed ? '#16a34a' : '#e5e7eb', margin: '0 4px' }} />}
    </div>
  );

  /* ── Complaint Detail View ───────────────────────────────── */
  const renderDetail = () => {
    if (!selectedComplaint) return null;
    const c = selectedComplaint;
    const statusOrder = ['PENDING', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
    const currentIndex = statusOrder.indexOf(c.status);

    return (
      <div style={{ animation: 'fadeInUp 0.3s ease' }}>
        <button onClick={() => { setView('list'); setSelectedComplaint(null); }} className="btn btn-ghost" style={{ marginBottom: 16, gap: 6 }}>
          <ArrowLeft size={16} /> Back to complaints
        </button>

        <div style={{
          background: '#fff', borderRadius: 16, padding: 28,
          border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{c.id}</p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#283618', margin: 0 }}>{c.title}</h2>
            </div>
            <StatusBadge status={c.status} />
          </div>

          {/* Description */}
          <p style={{ color: '#606c38', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>{c.description}</p>

          {/* Meta Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
            {c.category && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <p style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Category</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#283618' }}>{CATEGORIES.find(c2 => c2.value === c.category)?.label || c.category}</p>
              </div>
            )}
            {c.ward && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <p style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Ward</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#283618' }}>{c.ward}</p>
              </div>
            )}
            {c.assigned_team && (
              <div style={{ padding: '12px 16px', background: 'rgba(37,99,235,0.06)', borderRadius: 10, border: '1px solid rgba(37,99,235,0.15)' }}>
                <p style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Assigned Team</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>{c.assigned_team}</p>
              </div>
            )}
            {c.eta_minutes && (
              <div style={{ padding: '12px 16px', background: 'rgba(221,161,94,0.08)', borderRadius: 10, border: '1px solid rgba(221,161,94,0.2)' }}>
                <p style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>ETA</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#bc6c25' }}>{c.eta_minutes} minutes</p>
              </div>
            )}
          </div>

          {/* Progress Timeline */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Progress</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {statusOrder.map((s, i) => (
                <TimelineStep
                  key={s}
                  label={STATUS_CONFIG[s]?.label || s}
                  active={i === currentIndex}
                  completed={i < currentIndex}
                  last={i === statusOrder.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Photo Evidence */}
          {c.attachment && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>📷 Photo Evidence</p>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)', maxHeight: 320 }}>
                <img src={c.attachment} alt="Evidence" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          )}

          {/* Location */}
          {(c.address || (c.latitude && c.longitude)) && (
            <div style={{ padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>📍 Location & Address</p>
              {c.address && (
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#283618', marginBottom: 4 }}>{c.address}</p>
              )}
              {c.latitude && c.longitude && (
                <p style={{ fontSize: '0.8rem', color: '#606c38', fontFamily: 'var(--font-mono)' }}>
                  GPS: {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── New Complaint Form ──────────────────────────────────── */
  const renderForm = () => (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      <button onClick={() => setView('list')} className="btn btn-ghost" style={{ marginBottom: 16, gap: 6 }}>
        <ArrowLeft size={16} /> Cancel
      </button>

      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#283618', marginBottom: 4 }}>Report an Issue</h2>
        <p style={{ color: '#606c38', fontSize: '0.85rem', marginBottom: 24 }}>Help us improve your neighbourhood. Your complaint will be routed to the nearest available team.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>What's the issue? *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Pothole on Beach Road near RTC Complex"
              required
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Describe the problem</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Provide as much detail as possible…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                  style={{
                    padding: '10px 12px', borderRadius: 10, border: '1.5px solid',
                    borderColor: form.category === cat.value ? '#dda15e' : '#e5e7eb',
                    background: form.category === cat.value ? 'rgba(221,161,94,0.08)' : '#fff',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
                    fontSize: '0.8rem', fontWeight: form.category === cat.value ? 600 : 400,
                    color: form.category === cat.value ? '#bc6c25' : '#606c38',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '1.2rem', marginBottom: 4 }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                  style={{
                    flex: 1, padding: '8px 16px', borderRadius: 8, border: '1.5px solid',
                    borderColor: form.priority === p.value ? p.color : '#e5e7eb',
                    background: form.priority === p.value ? `${p.color}18` : '#fff',
                    cursor: 'pointer', fontSize: '0.8rem',
                    fontWeight: form.priority === p.value ? 600 : 400,
                    color: form.priority === p.value ? p.color : '#6b7280',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Address Section */}
          <div style={{ padding: 16, background: '#faf5d0', borderRadius: 12, border: '1px solid #d4cc9a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#283618', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color="#bc6c25" /> Location & Address
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locationLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#283618', color: '#fefae0', border: 'none',
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                {locationLoading ? (
                  <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Detecting...</>
                ) : (
                  <><Navigation size={12} /> Detect My Location</>
                )}
              </button>
            </div>

            {/* Address Field */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Landmark / Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="e.g. Near Siripuram Circle, Ward 12"
                style={{ ...inputStyle, background: '#fff' }}
              />
            </div>

            {/* Quick Location Presets */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '0.7rem', color: '#606c38', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Quick Zone Select:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { name: 'Siripuram', lat: 17.6868, lng: 83.2185 },
                  { name: 'RK Beach', lat: 17.6790, lng: 83.2110 },
                  { name: 'MVP Colony', lat: 17.7250, lng: 83.2380 },
                  { name: 'Gajuwaka', lat: 17.6950, lng: 83.2250 },
                  { name: 'Dwaraka Nagar', lat: 17.7180, lng: 83.2310 }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      address: preset.name,
                      latitude: preset.lat,
                      longitude: preset.lng
                    }))}
                    style={{
                      background: form.address === preset.name ? '#bc6c25' : '#fefae0',
                      color: form.address === preset.name ? '#fefae0' : '#283618',
                      border: '1px solid #d4cc9a',
                      borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem',
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#606c38', display: 'block', marginBottom: 4 }}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={e => setForm(p => ({ ...p, latitude: parseFloat(e.target.value) || 0 }))}
                  style={{ ...inputStyle, background: '#fff', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#606c38', display: 'block', marginBottom: 4 }}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={e => setForm(p => ({ ...p, longitude: parseFloat(e.target.value) || 0 }))}
                  style={{ ...inputStyle, background: '#fff', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>

          {/* Photo Evidence Section */}
          <div>
            <label style={labelStyle}>Photo Evidence (Optional)</label>
            {form.attachment ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                <img src={form.attachment} alt="Evidence preview" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, attachment: null }))}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(225, 29, 72, 0.9)', color: '#fff',
                    border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px', borderRadius: 12, border: '2px dashed #d4cc9a',
                background: '#fff', cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
                <Camera size={28} color="#bc6c25" style={{ marginBottom: 8 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#283618' }}>Upload Photo or Take Picture</span>
                <span style={{ fontSize: '0.75rem', color: '#606c38', marginTop: 2 }}>Supports JPG, PNG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.title.trim()}
            className="btn btn-primary btn-lg"
            style={{ marginTop: 8, width: '100%' }}
          >
            {submitting ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
            ) : (
              <><Send size={18} /> Submit Complaint</>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  /* ── Complaint List View ─────────────────────────────────── */
  const renderList = () => (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: complaints.length, color: '#283618' },
          { label: 'Pending', value: complaints.filter(c => c.status === 'PENDING').length, color: '#dda15e' },
          { label: 'In Progress', value: complaints.filter(c => ['ASSIGNED', 'IN_PROGRESS', 'OPEN'].includes(c.status)).length, color: '#2563eb' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'RESOLVED').length, color: '#16a34a' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', borderRadius: 12, padding: '16px 20px',
            border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xs)',
          }}>
            <p style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{stat.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Complaint Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {complaints.length === 0 && !loading ? (
          <div style={{
            textAlign: 'center', padding: 48, background: '#fff',
            borderRadius: 16, border: '1px solid var(--border-light)',
          }}>
            <FileText size={40} color="#d4cc9a" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No complaints filed yet</p>
            <button onClick={() => setView('new')} className="btn btn-primary" style={{ marginTop: 16 }}>
              <Plus size={16} /> Report your first issue
            </button>
          </div>
        ) : (
          complaints.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedComplaint(c); setView('detail'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                background: '#fff', borderRadius: 14, border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-xs)', cursor: 'pointer', width: '100%',
                textAlign: 'left', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#dda15e'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
            >
              {/* Category Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.3rem',
              }}>
                {CATEGORIES.find(cat => cat.value === c.category)?.emoji || '📋'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#283618', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>{c.id}</span>
                  {c.ward && <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>• {c.ward}</span>}
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>• {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status + Chevron */}
              <StatusBadge status={c.status} />
              <ChevronRight size={16} color="#d4cc9a" />
            </button>
          ))
        )}
      </div>
    </div>
  );

  /* ── Main Render ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid var(--border-light)',
        padding: '12px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fefae0', fontWeight: 700,
          }}>V</div>
          <div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#283618', margin: 0 }}>VizagOps Citizen Portal</h1>
            <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0 }}>GVMC Grievance Tracker</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={fetchComplaints} className="btn btn-icon" title="Refresh">
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--text-secondary)" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#283618' }}>{user?.name || 'Citizen'}</span>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Page Title */}
        {view === 'list' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#283618', margin: 0 }}>My Complaints</h2>
              <p style={{ color: '#606c38', fontSize: '0.85rem', marginTop: 4 }}>Track the status of your reported issues</p>
            </div>
            <button onClick={() => setView('new')} className="btn btn-primary">
              <Plus size={16} /> New Complaint
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Loader2 size={32} color="#dda15e" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af' }}>Loading complaints…</p>
          </div>
        ) : (
          <>
            {view === 'list' && renderList()}
            {view === 'new' && renderForm()}
            {view === 'detail' && renderDetail()}
          </>
        )}
      </main>

      {/* Floating Action Button (mobile) */}
      {view === 'list' && (
        <button onClick={() => setView('new')} className="btn-fab" style={{ display: 'none' }}>
          <Plus size={24} />
        </button>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .btn-fab { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Shared Styles ─────────────────────────────────────────── */
const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#283618',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid #e5e7eb',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-sans)',
  color: '#283618',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  background: '#fff',
  boxSizing: 'border-box',
};
