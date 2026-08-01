import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CitizenPortal from './pages/CitizenPortal';
import LiveMapPage from './pages/LiveMapPage';
import FieldTeamsPage from './pages/FieldTeamsPage';
import SensorFeedsPage from './pages/SensorFeedsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';

// Import design system and component styles
import './styles/design-system.css';
import './styles/components.css';
import './styles/buttons.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<LiveMapPage />} />
          <Route path="/field-teams" element={<FieldTeamsPage />} />
          <Route path="/sensors" element={<SensorFeedsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/citizen" element={<CitizenPortal />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
