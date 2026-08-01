const RENDER_API = 'https://city-operations-center-coc-i6aw.onrender.com/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || (!['localhost', '127.0.0.1'].includes(window.location.hostname) && !window.location.hostname.startsWith('10.') && !window.location.hostname.startsWith('192.')))
    ? RENDER_API 
    : 'http://localhost:3000/api/v1');

async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken') || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.error?.message || 'API request failed');
    }
    const json = await res.json();
    return json.data || json;
  } catch (error) {
    console.warn(`[API] Endpoint ${endpoint} unreachable or error:`, error.message);
    throw error;
  }
}

export const api = {
  // Complaints
  getComplaints: () => fetchWithAuth('/complaints'),
  createComplaint: (data) => fetchWithAuth('/complaints', { method: 'POST', body: JSON.stringify(data) }),

  // Field Teams
  getFieldTeams: () => fetchWithAuth('/field-teams'),
  updateFieldTeam: (id, data) => fetchWithAuth(`/field-teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Sensor Events
  getSensorEvents: () => fetchWithAuth('/sensor-events'),
  createSensorEvent: (data) => fetchWithAuth('/sensor-events', { method: 'POST', body: JSON.stringify(data) }),

  // Assignments / Dispatch
  createAssignment: (data) => fetchWithAuth('/assignments', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalyticsDashboard: () => fetchWithAuth('/analytics/dashboard'),
  getWardDistribution: () => fetchWithAuth('/analytics/wards'),

  // Audit Log & Verification
  getAuditLog: (id) => fetchWithAuth(`/audit/${id}`),
  verifyAuditChain: () => fetchWithAuth('/audit/verify'),
};

export default api;
