import { useState, useEffect, useMemo } from 'react';
import { Radio, Activity, Filter, MapPin, RefreshCw, Zap } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import useWebSocket from '../hooks/useWebSocket';
import { api } from '../services/api';

const VIZAG_SENSOR_NODES = [
  { id: 'SNS-VIZAG-01', type: 'Submersible Level', asset: 'Mudasarlova Reservoir Gate', severity: 'HIGH', value: '98.4m (+1.2m)', confidence: 0.96, ward: 'Ward 14 (Mudasarlova)', timestamp: 'Just now', lat: 17.7650, lng: 83.2750 },
  { id: 'SNS-VIZAG-02', type: 'Air Quality (AQI)', asset: 'Gajuwaka Industrial Hub', severity: 'CRITICAL', value: 'PM2.5: 148 µg/m³', confidence: 0.94, ward: 'Ward 22 (Gajuwaka)', timestamp: '2 mins ago', lat: 17.6950, lng: 83.2250 },
  { id: 'SNS-VIZAG-03', type: 'Smart Traffic Signal', asset: 'Siripuram Circle Controller', severity: 'HIGH', value: 'Desync: 14s (84 cars/m)', confidence: 0.91, ward: 'Ward 12 (Siripuram)', timestamp: '5 mins ago', lat: 17.6868, lng: 83.2185 },
  { id: 'SNS-VIZAG-04', type: 'Coastal Surge Probe', asset: 'RK Beach Storm Drain', severity: 'HIGH', value: 'Tide Surge: 2.1m', confidence: 0.95, ward: 'Ward 15 (RK Beach)', timestamp: '8 mins ago', lat: 17.6790, lng: 83.2110 },
  { id: 'SNS-VIZAG-05', type: 'Water Pipeline Pressure', asset: 'MVP Colony Main Trunk 8', severity: 'CRITICAL', value: 'Pressure: 82.1 PSI (+35%)', confidence: 0.97, ward: 'Ward 10 (MVP Colony)', timestamp: '12 mins ago', lat: 17.7250, lng: 83.2380 },
  { id: 'SNS-VIZAG-06', type: 'Seismic Strain Probe', asset: 'Vizag Port Wharf Gate 2', severity: 'NOMINAL', value: 'Strain: 12.4 MPa', confidence: 0.98, ward: 'Ward 18 (Port Area)', timestamp: '20 mins ago', lat: 17.6920, lng: 83.2980 }
];

const getSensorEmoji = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('water') || t.includes('submersible') || t.includes('level')) return '💧';
  if (t.includes('air') || t.includes('aqi')) return '💨';
  if (t.includes('traffic') || t.includes('signal')) return '🚦';
  if (t.includes('surge') || t.includes('tide') || t.includes('coastal')) return '🌊';
  if (t.includes('pressure') || t.includes('pipe')) return '🚰';
  if (t.includes('seismic') || t.includes('strain') || t.includes('slope')) return '⛰️';
  return '⚡';
};

export default function SensorFeedsPage() {
  const { isConnected } = useWebSocket();
  const [sensors, setSensors] = useState(VIZAG_SENSOR_NODES);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Live telemetry pulse simulation every 4 seconds
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => {
          if (s.id === 'SNS-VIZAG-02') {
            const nextVal = (140 + Math.random() * 15).toFixed(1);
            return { ...s, value: `PM2.5: ${nextVal} µg/m³`, timestamp: 'Just now' };
          }
          if (s.id === 'SNS-VIZAG-05') {
            const nextPsi = (78 + Math.random() * 6).toFixed(1);
            return { ...s, value: `Pressure: ${nextPsi} PSI (+35%)`, timestamp: 'Just now' };
          }
          return s;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const filteredSensors = useMemo(() => {
    return sensors.filter((s) => {
      return typeFilter === 'ALL' || s.type.toLowerCase().includes(typeFilter.toLowerCase());
    });
  }, [sensors, typeFilter]);

  const triggerAnomaly = () => {
    const anomaly = {
      id: `SNS-VIZAG-0${sensors.length + 1}`,
      type: 'Flood Sensor Anomaly',
      asset: 'Old Town Outfall Drain',
      severity: 'CRITICAL',
      value: 'Level: 1.85m Overflow',
      confidence: 0.98,
      ward: 'Ward 16 (Old City)',
      timestamp: new Date().toLocaleTimeString(),
      lat: 17.6980,
      lng: 83.2920
    };
    setSensors(prev => [anomaly, ...prev]);
  };

  return (
    <DashboardLayout wsStatus={isConnected ? 'connected' : 'connecting'}>
      <div className="sensors-page space-y-5">
        {/* Minimal Header Toolbar */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {isLiveStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#bc6c25] opacity-75"></span>
              )}
              <div className="relative p-2 bg-[#bc6c25] text-[#fefae0] rounded-xl">
                <Radio size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#283618]">Vizag IoT Telemetry Stream</h2>
              <p className="text-xs text-[#606c38]">Real-time civic sensors across Visakhapatnam</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerAnomaly}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#dda15e] hover:bg-[#bc6c25] text-[#283618] hover:text-[#fefae0] rounded-xl text-xs font-bold transition-all"
            >
              <Zap size={13} />
              <span>Simulate Anomaly</span>
            </button>

            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`flex items-center gap-1 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all ${
                isLiveStreaming ? 'bg-[#606c38] text-[#fefae0] border-[#606c38]' : 'bg-[#fefae0] text-[#283618] border-[#d4cc9a]'
              }`}
            >
              <Activity size={13} />
              <span>{isLiveStreaming ? 'Live Stream' : 'Paused'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-[#fefae0] border border-[#d4cc9a] rounded-xl px-2.5 py-1 text-xs font-bold text-[#283618]">
              <Filter size={13} className="text-[#606c38]" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-[#283618] font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Water">💧 Water & Flood</option>
                <option value="Air">💨 Air Quality (AQI)</option>
                <option value="Traffic">🚦 Traffic Signals</option>
                <option value="Pressure">🚰 Water Pressure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clean Sensor Cards Grid with Visual Emoji Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((s) => {
            const isCritical = s.severity === 'CRITICAL';
            const isHigh = s.severity === 'HIGH';
            const emoji = getSensorEmoji(s.type);

            return (
              <div
                key={s.id}
                className={`bg-[#faf5d0] border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                  isCritical ? 'border-red-400 bg-red-50/40' :
                  isHigh ? 'border-amber-400 bg-amber-50/40' :
                  'border-[#d4cc9a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#d4cc9a]/50 pb-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base p-1 bg-[#fefae0] rounded-md border border-[#d4cc9a]/60">{emoji}</span>
                      <span className="text-xs font-mono font-bold text-[#8a9460]">{s.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      isCritical ? 'bg-red-500/20 text-red-700' :
                      isHigh ? 'bg-amber-500/20 text-amber-800' :
                      'bg-green-500/20 text-green-800'
                    }`}>
                      {s.severity}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#283618] mb-1 flex items-center gap-1.5">
                    <span>{s.type}</span>
                  </h3>
                  <span className="text-xs text-[#606c38] font-semibold block mb-3">{s.asset}</span>

                  <div className="bg-[#fefae0] p-2.5 rounded-xl border border-[#d4cc9a]/60 space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#606c38]">Telemetry Reading:</span>
                      <span className="font-mono font-extrabold text-[#bc6c25] flex items-center gap-1">
                        <span>{emoji}</span>
                        <span>{s.value}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#606c38]">AI Confidence:</span>
                      <span className="font-mono font-bold text-[#606c38]">{(s.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#d4cc9a]/50 text-xs">
                  <span className="font-semibold text-[#606c38] flex items-center gap-1 text-[11px]">
                    <MapPin size={13} className="text-[#bc6c25]" />
                    {s.ward}
                  </span>
                  <span className="font-mono text-[10px] text-[#8a9460]">{s.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
