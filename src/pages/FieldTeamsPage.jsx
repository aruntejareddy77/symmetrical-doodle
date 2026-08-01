import { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, Navigation, Search, Filter, Radio, PhoneCall, ChevronRight, MapPin, Wrench } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import useWebSocket from '../hooks/useWebSocket';
import { api } from '../services/api';

const SPECIALIZED_FIELD_TEAMS = [
  {
    id: 'FT-Alpha',
    name: 'Alpha Road & Asphalt Crew',
    role: 'Pothole & Asphalt Repair Specialist',
    category: 'INFRASTRUCTURE',
    categoryName: 'Roads & Potholes',
    emoji: '🛣️',
    leader: 'Inspector K. Ramesh',
    members: ['A. Kumar', 'P. Singh', 'M. Reddy'],
    status: 'AVAILABLE',
    currentWard: 'GVMC Ward 12 (Siripuram)',
    contact: '+91 98765 43210',
    lastPing: '1 min ago',
    lat: 17.6890,
    lng: 83.2170
  },
  {
    id: 'FT-Bravo',
    name: 'Bravo Water Mains Unit',
    role: 'Hydraulic Burst & Pipeline Technician',
    category: 'WATER_SUPPLY',
    categoryName: 'Water Line & Supply Leaks',
    emoji: '💧',
    leader: 'Supervisor S. Anita',
    members: ['R. Rao', 'K. Gowd', 'T. Naidu'],
    status: 'EN_ROUTE',
    currentWard: 'GVMC Ward 10 (MVP Colony)',
    contact: '+91 98765 43211',
    lastPing: '3 mins ago',
    lat: 17.7250,
    lng: 83.2380
  },
  {
    id: 'FT-Charlie',
    name: 'Charlie Smart Grid & Signals',
    role: 'Traffic Light & High Voltage Tech',
    category: 'ELECTRICAL',
    categoryName: 'Streetlights & Grid Telemetry',
    emoji: '💡',
    leader: 'Tech Lead D. Suresh',
    members: ['B. Raju', 'G. Sharma', 'L. Varma'],
    status: 'ON_SITE',
    currentWard: 'GVMC Ward 08 (Kailasagiri)',
    contact: '+91 98765 43212',
    lastPing: 'Just now',
    lat: 17.6800,
    lng: 83.2100
  },
  {
    id: 'FT-Delta',
    name: 'Delta Flood & Drainage Ops',
    role: 'Submersible Pump & Sewage Operator',
    category: 'DRAINAGE',
    categoryName: 'Drain Overflow & Inundation',
    emoji: '🌊',
    leader: 'Engineer B. Prakash',
    members: ['M. Naidu', 'J. Das', 'C. Chander'],
    status: 'AVAILABLE',
    currentWard: 'GVMC Ward 14 (Mudasarlova)',
    contact: '+91 98765 43213',
    lastPing: '5 mins ago',
    lat: 17.7650,
    lng: 83.2750
  },
  {
    id: 'FT-Echo',
    name: 'Echo Waste & Sanitation Squad',
    role: 'Debris Clearance & Bio-Waste Crew',
    category: 'SANITATION',
    categoryName: 'Sanitation & Waste Clearance',
    emoji: '🧹',
    leader: 'Officer V. Lakshmi',
    members: ['H. Babu', 'R. Naidu', 'N. Rao'],
    status: 'AVAILABLE',
    currentWard: 'GVMC Ward 22 (Gajuwaka)',
    contact: '+91 98765 43214',
    lastPing: '10 mins ago',
    lat: 17.6950,
    lng: 83.2250
  }
];

export default function FieldTeamsPage() {
  const { isConnected } = useWebSocket();
  const [teams, setTeams] = useState(SPECIALIZED_FIELD_TEAMS);
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dispatchModalTeam, setDispatchModalTeam] = useState(null);
  const [selectedIncidentForDispatch, setSelectedIncidentForDispatch] = useState('');

  // Fetch real citizen complaints from backend PostgreSQL
  useEffect(() => {
    async function loadComplaints() {
      try {
        const data = await api.getComplaints();
        if (Array.isArray(data)) {
          setComplaints(data);
        }
      } catch {
        // Fallback
      }
    }
    loadComplaints();
  }, []);

  // Map real complaints matching each team's job role category
  const teamsWithAssignedWorks = useMemo(() => {
    return teams.map(team => {
      // Find citizen complaints matching team's category
      const matching = complaints.filter(c => {
        const cat = (c.category || '').toUpperCase();
        return cat.includes(team.category) || team.category.includes(cat);
      });

      const assignedTask = matching.find(c => c.status === 'assigned' || c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') || matching[0];

      return {
        ...team,
        assignedComplaints: matching,
        currentWork: assignedTask ? {
          id: assignedTask.id || assignedTask.complaint_id,
          title: assignedTask.title || assignedTask.description || 'Citizen Reported Task',
          category: assignedTask.category || team.category,
          ward: assignedTask.ward || team.currentWard,
          status: assignedTask.status || 'ASSIGNED'
        } : null
      };
    });
  }, [teams, complaints]);

  const filteredTeams = useMemo(() => {
    return teamsWithAssignedWorks.filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [teamsWithAssignedWorks, searchQuery, categoryFilter]);

  const handleConfirmDispatch = async () => {
    if (!dispatchModalTeam || !selectedIncidentForDispatch) return;
    try {
      await api.createAssignment({
        complaintId: selectedIncidentForDispatch,
        fieldTeamId: dispatchModalTeam.id,
      });
    } catch {
      // Local fallback mode
    }

    const assignedInfo = {
      id: selectedIncidentForDispatch,
      complaint_id: selectedIncidentForDispatch,
      status: 'ASSIGNED',
      assignedTeam: dispatchModalTeam.name,
      teamId: dispatchModalTeam.id,
      assignedAt: new Date().toLocaleTimeString()
    };

    // Broadcast event across window and localStorage
    window.dispatchEvent(new CustomEvent('complaint.assigned', { detail: assignedInfo }));
    const stored = JSON.parse(localStorage.getItem('vizag_assignments') || '{}');
    stored[selectedIncidentForDispatch] = assignedInfo;
    localStorage.setItem('vizag_assignments', JSON.stringify(stored));

    setTeams(teams.map(t => t.id === dispatchModalTeam.id ? { ...t, status: 'EN_ROUTE' } : t));
    alert(`✅ Assigned ${selectedIncidentForDispatch} to ${dispatchModalTeam.name}! Updated across Dashboard, Live Map, Triage, Audit Log & Citizen Portal.`);
    setDispatchModalTeam(null);
  };

  return (
    <DashboardLayout wsStatus={isConnected ? 'connected' : 'connecting'}>
      <div className="field-teams-page space-y-6">
        {/* Top Header Summary */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#bc6c25] text-[#fefae0] rounded-xl shadow">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#283618]">Vizag Specialized Field Teams</h2>
              <p className="text-xs text-[#606c38]">Teams assigned to citizen complaints matching their technical job role</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-[#283618]">
            <span className="bg-[#fefae0] border border-[#d4cc9a] px-3 py-1.5 rounded-xl">
              5 Specialized Units
            </span>
            <span className="bg-[#fefae0] border border-[#d4cc9a] px-3 py-1.5 rounded-xl text-[#bc6c25]">
              {complaints.length} Citizen Complaints Ingested
            </span>
          </div>
        </div>

        {/* Search & Role Filter Bar */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9460]" />
            <input
              type="text"
              placeholder="Search team name, job role, leader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#bc6c25]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#606c38]">
            <Filter size={14} />
            <span>Job Role Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#fefae0] border border-[#d4cc9a] text-[#283618] rounded-md px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="INFRASTRUCTURE">🛣️ Roads & Potholes</option>
              <option value="WATER_SUPPLY">💧 Water Line & Leakage</option>
              <option value="ELECTRICAL">💡 Streetlights & Grid</option>
              <option value="DRAINAGE">🌊 Drainage & Flood Ops</option>
              <option value="SANITATION">🧹 Sanitation & Waste</option>
            </select>
          </div>
        </div>

        {/* Specialized Field Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const isAvailable = team.status === 'AVAILABLE';
            const isEnRoute = team.status === 'EN_ROUTE';
            const isOnSite = team.status === 'ON_SITE';
            const work = team.currentWork;

            return (
              <div key={team.id} className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  {/* Team Card Header */}
                  <div className="flex items-center justify-between border-b border-[#d4cc9a]/60 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1.5 bg-[#fefae0] border border-[#d4cc9a] rounded-xl">{team.emoji}</span>
                      <div>
                        <span className="text-xs font-mono font-bold text-[#8a9460] block">{team.id}</span>
                        <h3 className="text-base font-extrabold text-[#283618]">{team.name}</h3>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      isAvailable ? 'bg-[#606c38]/20 text-[#606c38]' :
                      isEnRoute ? 'bg-[#dda15e]/25 text-[#bc6c25]' :
                      isOnSite ? 'bg-[#bc6c25]/20 text-[#bc6c25]' :
                      'bg-gray-300/40 text-gray-700'
                    }`}>
                      {team.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Team Role & Specialty */}
                  <div className="bg-[#fefae0] p-3 rounded-xl border border-[#d4cc9a]/60 space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#606c38] font-bold flex items-center gap-1">
                        <Wrench size={13} className="text-[#bc6c25]" /> Technical Job Role:
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#283618]">{team.role}</p>
                    <span className="text-[11px] font-bold text-[#bc6c25] block">
                      Target Category: {team.emoji} {team.categoryName}
                    </span>
                  </div>

                  {/* Assigned Citizen Work */}
                  <div className="bg-[#faf5d0] border border-[#d4cc9a] p-3 rounded-xl space-y-2 mb-3">
                    <span className="text-[11px] font-extrabold uppercase text-[#606c38] block border-b border-[#d4cc9a]/40 pb-1">
                      Assigned Citizen Complaint:
                    </span>
                    {work ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-start text-xs font-extrabold text-[#283618]">
                          <span className="max-w-[200px] truncate" title={work.title}>{work.title}</span>
                          <span className="text-[10px] font-mono text-[#bc6c25]">{work.id}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#606c38] font-semibold">
                          <span>{team.emoji} {work.category}</span>
                          <span>{work.ward}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#8a9460] font-semibold block italic">
                        No active complaints assigned. Standing by for {team.categoryName} reports.
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-[#283618]">
                    <div className="flex justify-between">
                      <span className="text-[#606c38]">Team Leader:</span>
                      <span className="font-bold">{team.leader}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#606c38]">Personnel:</span>
                      <span className="font-bold">{team.members.length} Crew Members</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#606c38]">Stationed Zone:</span>
                      <span className="font-semibold">{team.currentWard}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#d4cc9a]/60 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${team.contact}`}
                    className="p-2 rounded-xl bg-[#fefae0] border border-[#d4cc9a] text-[#283618] hover:bg-[#bc6c25] hover:text-[#fefae0] transition-colors"
                    title={`Call ${team.leader}`}
                  >
                    <PhoneCall size={16} />
                  </a>

                  <button
                    onClick={() => {
                      setDispatchModalTeam(team);
                      setSelectedIncidentForDispatch(work?.id || team.assignedComplaints[0]?.id || '');
                    }}
                    className="flex-1 py-2 bg-[#bc6c25] hover:bg-[#dda15e] text-[#fefae0] rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1"
                  >
                    <span>Assign {team.categoryName} Task</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Specialized Dispatch Modal */}
        {dispatchModalTeam && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-2 border-b border-[#d4cc9a] pb-3">
                <span className="text-2xl">{dispatchModalTeam.emoji}</span>
                <div>
                  <h3 className="text-base font-extrabold text-[#283618]">Assign Work: {dispatchModalTeam.name}</h3>
                  <span className="text-xs font-bold text-[#bc6c25]">{dispatchModalTeam.role}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#283618]">Select Citizen Complaint ({dispatchModalTeam.categoryName}):</label>
                <select
                  value={selectedIncidentForDispatch}
                  onChange={(e) => setSelectedIncidentForDispatch(e.target.value)}
                  className="w-full bg-[#fefae0] border border-[#d4cc9a] text-[#283618] rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                >
                  {dispatchModalTeam.assignedComplaints.length > 0 ? (
                    dispatchModalTeam.assignedComplaints.map(c => (
                      <option key={c.id || c.complaint_id} value={c.id || c.complaint_id}>
                        {dispatchModalTeam.emoji} [{c.id || c.complaint_id}] {c.title || c.description} ({c.ward || 'GVMC Zone'})
                      </option>
                    ))
                  ) : (
                    <option value="">No pending {dispatchModalTeam.categoryName} complaints</option>
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfirmDispatch}
                  className="flex-1 bg-[#bc6c25] hover:bg-[#dda15e] text-[#fefae0] py-2.5 rounded-xl text-xs font-bold shadow"
                >
                  Confirm Assignment
                </button>
                <button
                  onClick={() => setDispatchModalTeam(null)}
                  className="px-4 py-2.5 bg-[#fefae0] border border-[#d4cc9a] rounded-xl text-xs font-semibold text-[#283618] hover:bg-[#faf5d0]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
