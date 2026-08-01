import { useState, useEffect } from 'react';
import { Settings, User, Sliders, Bell, Database, Save, Check, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';

const DEFAULT_SETTINGS = {
  operatorName: 'Priya S.',
  operatorRole: 'Senior Operations Officer',
  assignedWard: 'GVMC-W12',
  mapTheme: 'light',
  matchingRadiusMeters: 5000,
  matchingWindowMinutes: 15,
  autoDispatchThreshold: 0.85,
  enableWsAlerts: true,
  enableSmsGateway: true,
  enableEmailAlerts: false,
  apiEndpoint: 'http://localhost:3000/api/v1',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('vizagops_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('vizagops_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('vizagops_settings');
  };

  return (
    <DashboardLayout>
      <div className="settings-page max-w-4xl space-y-6">
        {/* Settings Header */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#bc6c25] text-[#fefae0] rounded-xl shadow">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#283618]">Control Center Settings</h2>
              <p className="text-xs text-[#606c38]">
                Configure operator defaults, spatial matching parameters, and notification channels.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-[#fefae0] border border-[#d4cc9a] rounded-xl text-xs font-semibold text-[#283618] hover:bg-[#faf5d0]"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#bc6c25] hover:bg-[#dda15e] text-[#fefae0] rounded-xl text-xs font-bold shadow transition-all"
            >
              {savedSuccess ? <Check size={16} /> : <Save size={16} />}
              <span>{savedSuccess ? 'Settings Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Section 1: General & Operator Profile */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-[#d4cc9a]/60 pb-3">
            <User size={18} className="text-[#bc6c25]" />
            <h3 className="text-base font-extrabold text-[#283618]">General Operator Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#606c38] mb-1">Operator Display Name</label>
              <input
                type="text"
                value={settings.operatorName}
                onChange={(e) => handleChange('operatorName', e.target.value)}
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl px-3 py-2 text-xs font-semibold text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#bc6c25]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#606c38] mb-1">Assigned Command Zone / Ward</label>
              <input
                type="text"
                value={settings.assignedWard}
                onChange={(e) => handleChange('assignedWard', e.target.value)}
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl px-3 py-2 text-xs font-semibold text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#bc6c25]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Spatial Matching Engine Configuration */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-[#d4cc9a]/60 pb-3">
            <Sliders size={18} className="text-[#bc6c25]" />
            <h3 className="text-base font-extrabold text-[#283618]">Spatial Matching Engine Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#606c38] mb-1">Max Dispatch Radius (Meters)</label>
              <input
                type="number"
                value={settings.matchingRadiusMeters}
                onChange={(e) => handleChange('matchingRadiusMeters', parseInt(e.target.value))}
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl px-3 py-2 text-xs font-semibold text-[#283618] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#606c38] mb-1">Time Window (Minutes)</label>
              <input
                type="number"
                value={settings.matchingWindowMinutes}
                onChange={(e) => handleChange('matchingWindowMinutes', parseInt(e.target.value))}
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl px-3 py-2 text-xs font-semibold text-[#283618] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#606c38] mb-1">Auto-Dispatch Confidence Score</label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="1.0"
                value={settings.autoDispatchThreshold}
                onChange={(e) => handleChange('autoDispatchThreshold', parseFloat(e.target.value))}
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl px-3 py-2 text-xs font-semibold text-[#283618] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification Channels */}
        <div className="bg-[#faf5d0] border border-[#d4cc9a] rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-[#d4cc9a]/60 pb-3">
            <Bell size={18} className="text-[#bc6c25]" />
            <h3 className="text-base font-extrabold text-[#283618]">Notification Channels</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-[#fefae0] border border-[#d4cc9a] rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-[#283618] block">WebSocket Real-Time Popups</span>
                <span className="text-[11px] text-[#606c38]">Stream live complaint and sensor alerts directly onto screen</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableWsAlerts}
                onChange={(e) => handleChange('enableWsAlerts', e.target.checked)}
                className="w-4 h-4 accent-[#bc6c25] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#fefae0] border border-[#d4cc9a] rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-[#283618] block">SMS Dispatch Adapter</span>
                <span className="text-[11px] text-[#606c38]">Send automated SMS to field team leaders upon task assignment</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableSmsGateway}
                onChange={(e) => handleChange('enableSmsGateway', e.target.checked)}
                className="w-4 h-4 accent-[#bc6c25] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
