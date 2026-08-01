import { useState, useEffect, useMemo } from 'react';
import { Filter, Layers, Search, MapPin, AlertTriangle, ShieldCheck, RefreshCw, X, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import LiveMap from '../components/Map/LiveMap';
import useWebSocket from '../hooks/useWebSocket';
import { api } from '../services/api';

const MOCK_COMPLAINTS = [
  { id: 'CMP-101', title: 'Severe Road Pothole', category: 'pothole', priority: 'HIGH', status: 'PENDING', ward: 'GVMC-W12', latitude: 17.6868, longitude: 83.2185, createdAt: '10 mins ago', description: 'Deep pothole causing vehicle slow down near Siripuram Junction.' },
  { id: 'CMP-102', title: 'Main Water Line Burst', category: 'water_leak', priority: 'CRITICAL', status: 'IN_PROGRESS', ward: 'GVMC-W14', latitude: 17.6950, longitude: 83.2250, createdAt: '25 mins ago', description: 'High pressure water leak flooding the main thoroughfare.' },
  { id: 'CMP-103', title: 'Traffic Signal Failure', category: 'traffic_signal', priority: 'HIGH', status: 'PENDING', ward: 'GVMC-W08', latitude: 17.6790, longitude: 83.2110, createdAt: '40 mins ago', description: 'Signals blinking red in all directions at RK Beach intersection.' },
  { id: 'CMP-104', title: 'Solid Waste Overflow', category: 'garbage', priority: 'MEDIUM', status: 'RESOLVED', ward: 'GVMC-W15', latitude: 17.7100, longitude: 83.2400, createdAt: '1 hour ago', description: 'Community dumpster overflowing onto sidewalk.' },
  { id: 'CMP-105', title: 'Street Light Outage Grid', category: 'electricity', priority: 'MEDIUM', status: 'IN_PROGRESS', ward: 'GVMC-W12', latitude: 17.6910, longitude: 83.2150, createdAt: '2 hours ago', description: '12 consecutive streetlights non-functional along Coastal Battery Road.' }
];

const MOCK_FIELD_TEAMS = [
  { id: 'FT-Alpha', name: 'Alpha Response Unit', status: 'available', latitude: 17.6890, longitude: 83.2170, members: 4, leader: 'Officer Ramesh' },
  { id: 'FT-Bravo', name: 'Bravo Rapid Repair', status: 'en_route', latitude: 17.6940, longitude: 83.2230, members: 3, leader: 'Supervisor Anita' },
  { id: 'FT-Charlie', name: 'Charlie Heavy Fleet', status: 'on_site', latitude: 17.6800, longitude: 83.2100, members: 5, leader: 'Tech Lead Suresh' },
  { id: 'FT-Delta', name: 'Delta Sanitary Unit', status: 'available', latitude: 17.7050, longitude: 83.2350, members: 4, leader: 'Inspector Kumar' }
];

const MOCK_SENSOR_EVENTS = [
  { id: 'SNS-801', type: 'Flood Sensor', severity: 'HIGH', latitude: 17.6980, longitude: 83.2280, value: 'Water Level: 45cm', timestamp: '5 mins ago' },
  { id: 'SNS-802', type: 'Vibration/Structural', severity: 'CRITICAL', latitude: 17.6840, longitude: 83.2140, value: 'Anomaly Score: 0.92', timestamp: '12 mins ago' }
];

export default function LiveMapPage() {
  const [complaints, setComplaints] = useState([]);
  const [fieldTeams, setFieldTeams] = useState(MOCK_FIELD_TEAMS);
  const [sensorEvents, setSensorEvents] = useState(MOCK_SENSOR_EVENTS);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensors, setShowSensors] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleWsMessage = (event) => {
    if (event.type === 'complaint.new') {
      const incoming = event.data;
      setComplaints((prev) => [
        {
          id: incoming.id || incoming.complaint_id,
          title: incoming.title || incoming.description || 'Citizen Complaint',
          category: incoming.category || 'INFRASTRUCTURE',
          priority: incoming.priority || 'HIGH',
          status: incoming.status || 'PENDING',
          ward: incoming.ward || incoming.ward_id || 'GVMC-W12',
          latitude: incoming.latitude || incoming.location?.lat || 17.6868,
          longitude: incoming.longitude || incoming.location?.lng || 83.2185,
          createdAt: incoming.createdAt || incoming.reported_at || 'Just now',
          description: incoming.description || ''
        },
        ...prev
      ]);
    }
  };

  const { isConnected } = useWebSocket(handleWsMessage);

  // Fetch backend data on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [backendComplaints, backendTeams, backendSensors] = await Promise.allSettled([
          api.getComplaints(),
          api.getFieldTeams(),
          api.getSensorEvents(),
        ]);

        if (backendComplaints.status === 'fulfilled' && Array.isArray(backendComplaints.value) && backendComplaints.value.length > 0) {
          const storedAssignments = JSON.parse(localStorage.getItem('vizag_assignments') || '{}');
          setComplaints(backendComplaints.value.map(c => {
            const id = c.id || c.complaint_id;
            const assign = storedAssignments[id];
            return {
              id: c.id,
              title: c.title || c.description || 'Citizen Complaint',
              category: c.category || 'INFRASTRUCTURE',
              priority: c.priority || 'HIGH',
              status: assign?.status || c.status || 'PENDING',
              assignedTeam: assign?.assignedTeam || null,
              ward: c.ward || 'GVMC-W12',
              latitude: c.latitude || 17.6868,
              longitude: c.longitude || 83.2185,
              createdAt: c.createdAt ? new Date(c.createdAt).toLocaleTimeString() : 'Recently',
              description: c.description || ''
            };
          }));
        } else {
          setComplaints(MOCK_COMPLAINTS);
        }
        if (backendTeams.status === 'fulfilled' && Array.isArray(backendTeams.value) && backendTeams.value.length > 0) {
          setFieldTeams(backendTeams.value);
        }
        if (backendSensors.status === 'fulfilled' && Array.isArray(backendSensors.value) && backendSensors.value.length > 0) {
          setSensorEvents(backendSensors.value);
        }
      } catch {
        setComplaints(MOCK_COMPLAINTS);
      }
    }
    loadBackendData();
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const itemCat = ((item.category || '') + ' ' + (item.type || '') + ' ' + (item.title || '') + ' ' + (item.description || '')).toUpperCase();
      const targetCat = categoryFilter.toUpperCase();
      
      let matchCat = categoryFilter === 'ALL';
      if (!matchCat) {
        if (targetCat === 'INFRASTRUCTURE') matchCat = itemCat.includes('INFRASTRUCTURE') || itemCat.includes('POTHOLE') || itemCat.includes('ROAD');
        else if (targetCat === 'WATER_SUPPLY') matchCat = itemCat.includes('WATER') || itemCat.includes('PIPE') || itemCat.includes('LEAK');
        else if (targetCat === 'ELECTRICAL') matchCat = itemCat.includes('ELECTRICAL') || itemCat.includes('LIGHT') || itemCat.includes('POWER') || itemCat.includes('SIGNAL');
        else if (targetCat === 'DRAINAGE') matchCat = itemCat.includes('DRAINAGE') || itemCat.includes('FLOOD') || itemCat.includes('SEWER');
        else if (targetCat === 'SANITATION') matchCat = itemCat.includes('SANITATION') || itemCat.includes('GARBAGE') || itemCat.includes('WASTE');
        else matchCat = itemCat.includes(targetCat);
      }

      const itemStatus = (item.status || '').toUpperCase();
      const targetStatus = statusFilter.toUpperCase();
      let matchStatus = statusFilter === 'ALL';
      if (!matchStatus) {
        if (targetStatus === 'PENDING') matchStatus = itemStatus === 'PENDING' || itemStatus === 'RECEIVED' || itemStatus === 'OPEN';
        else if (targetStatus === 'IN_PROGRESS') matchStatus = itemStatus === 'IN_PROGRESS' || itemStatus === 'ASSIGNED';
        else if (targetStatus === 'RESOLVED') matchStatus = itemStatus === 'RESOLVED' || itemStatus === 'CLOSED';
        else matchStatus = itemStatus === targetStatus;
      }

      const matchSearch = searchQuery === '' || 
        (item.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.ward && item.ward.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchStatus && matchSearch;
    });
  }, [complaints, categoryFilter, statusFilter, searchQuery]);

  const handleDispatch = async (incident) => {
    try {
      await api.createAssignment({
        complaintId: incident.id || incident.complaint_id,
        fieldTeamId: fieldTeams[0]?.id || 'FT-Alpha',
      });
      alert(`Assignment created in backend for ${incident.id}!`);
    } catch {
      alert(`Dispatched ${incident.id} (Local Fallback Mode)`);
    }
    setSelectedIncident(null);
  };

  return (
    <DashboardLayout wsStatus={isConnected ? 'connected' : 'connecting'} activeIncidents={filteredComplaints.length}>
      <div className="live-map-page flex flex-col h-[calc(100vh-140px)] gap-4">
        {/* Top Control Bar */}
        <div className="map-toolbar bg-[#faf5d0] border border-[#d4cc9a] rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9460]" />
              <input
                type="text"
                placeholder="Filter map by ID, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#bc6c25]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#606c38] font-medium">
              <Filter size={14} />
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#fefae0] border border-[#d4cc9a] text-[#283618] rounded-md px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="INFRASTRUCTURE">🛣️ Roads / Potholes</option>
                <option value="WATER_SUPPLY">💧 Water Leakage & Supply</option>
                <option value="ELECTRICAL">💡 Streetlights & Grid</option>
                <option value="DRAINAGE">🌊 Drainage & Submersible</option>
                <option value="SANITATION">🧹 Sanitation & Garbage</option>
                <option value="GENERAL">📋 General / Other</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#606c38] font-medium">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#fefae0] border border-[#d4cc9a] text-[#283618] rounded-md px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending / Received</option>
                <option value="IN_PROGRESS">In Progress / Assigned</option>
                <option value="RESOLVED">Resolved / Closed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[#283618]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSensors}
                onChange={(e) => setShowSensors(e.target.checked)}
                className="accent-[#bc6c25] rounded cursor-pointer"
              />
              <span>Sensor Pins ({sensorEvents.length})</span>
            </label>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                showHeatmap
                  ? 'bg-[#bc6c25] text-[#fefae0] border-[#bc6c25] shadow'
                  : 'bg-[#fefae0] text-[#283618] border-[#d4cc9a] hover:bg-[#faf5d0]'
              }`}
            >
              <Layers size={14} />
              <span>{showHeatmap ? 'Heatmap Active' : 'Heatmap Overlay'}</span>
            </button>
          </div>
        </div>

        {/* Map Container and Drawer */}
        <div className="relative flex-1 rounded-2xl overflow-hidden border border-[#d4cc9a] shadow-xl">
          <LiveMap
            complaints={filteredComplaints}
            sensorEvents={showSensors ? sensorEvents : []}
            fieldTeams={fieldTeams}
            selectedIncident={selectedIncident}
            onMarkerClick={(type, item) => setSelectedIncident({ type, ...item })}
          />

          {/* Incident Detail Slide-over Panel */}
          {selectedIncident && (
            <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 bg-[#faf5d0]/95 backdrop-blur-md border border-[#d4cc9a] rounded-2xl p-5 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between border-b border-[#d4cc9a] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#bc6c25]/15 text-[#bc6c25]">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <span className="text-xs font-mono font-bold text-[#8a9460] block">{selectedIncident.id || selectedIncident.complaint_id}</span>
                    <h3 className="text-sm font-extrabold text-[#283618] line-clamp-1">{selectedIncident.title || selectedIncident.name || 'Map Marker'}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 rounded-lg hover:bg-[#d4cc9a]/40 text-[#606c38] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#283618]">
                <div className="flex justify-between items-center bg-[#fefae0] p-2.5 rounded-lg border border-[#d4cc9a]/60">
                  <span className="text-[#606c38]">Ward & Location</span>
                  <span className="font-bold">{selectedIncident.ward || 'GVMC Zone 1'}</span>
                </div>

                <div className="flex justify-between items-center bg-[#fefae0] p-2.5 rounded-lg border border-[#d4cc9a]/60">
                  <span className="text-[#606c38]">Priority Level</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                    selectedIncident.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-700' : 'bg-amber-500/20 text-amber-800'
                  }`}>
                    {selectedIncident.priority || 'NORMAL'}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#fefae0] p-2.5 rounded-lg border border-[#d4cc9a]/60">
                  <span className="text-[#606c38]">Current Status</span>
                  <span className="font-bold text-[#606c38]">{selectedIncident.status || 'Active'}</span>
                </div>

                <div className="bg-[#fefae0] p-3 rounded-lg border border-[#d4cc9a]/60">
                  <span className="text-[#606c38] font-semibold block mb-1">Details / Reported Issue</span>
                  <p className="text-xs text-[#283618] leading-relaxed">
                    {selectedIncident.description || selectedIncident.value || 'Active operational telemetry node registered in spatial index.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#d4cc9a] flex gap-2">
                <button
                  onClick={() => handleDispatch(selectedIncident)}
                  className="flex-1 bg-[#bc6c25] hover:bg-[#dda15e] text-[#fefae0] py-2 rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1"
                >
                  <span>Dispatch Team</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-3 py-2 bg-[#fefae0] border border-[#d4cc9a] rounded-xl text-xs font-semibold text-[#283618] hover:bg-[#faf5d0]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
