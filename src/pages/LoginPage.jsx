import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Lock, ArrowRight, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') === 'admin' ? 'officer' : 'citizen';

  const [activeTab, setActiveTab] = useState(initialRole); // 'citizen' | 'officer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Set default credentials when tab changes
  useEffect(() => {
    if (activeTab === 'citizen') {
      setEmail('citizen@gmail.com');
      setPassword('password123');
    } else {
      setEmail('admin@vizagops.gov.in');
      setPassword('password123');
    }
    setError('');
  }, [activeTab]);

  const handleQuickFillAdmin = () => {
    setActiveTab('officer');
    setEmail('admin@vizagops.gov.in');
    setPassword('password123');
    setError('');
  };

  const handleQuickFillWardOfficer = () => {
    setActiveTab('officer');
    setEmail('officer@vizagops.gov.in');
    setPassword('password123');
    setError('');
  };

  const handleQuickFillResident = () => {
    setActiveTab('citizen');
    setEmail('citizen@gmail.com');
    setPassword('password123');
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    // Simulate quick Google authentication delay for realistic UX
    setTimeout(async () => {
      const result = await loginWithGoogle({
        name: 'Visakhapatnam Citizen',
        email: 'citizen@gmail.com',
      });

      if (result.success) {
        navigate('/citizen', { replace: true });
      } else {
        setError(result.error || 'Google Authentication failed.');
        setGoogleLoading(false);
      }
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      const role = result.user?.role?.toUpperCase();
      if (role === 'CITIZEN' || activeTab === 'citizen') {
        navigate('/citizen', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.error || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fefae0] text-[#283618] flex items-center justify-center relative p-4 sm:p-6 overflow-hidden">
      {/* Background Aurora */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#dda15e]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#606c38]/15 blur-[100px] pointer-events-none" />

      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center gap-2 text-xs font-bold text-[#606c38] hover:text-[#283618] transition-colors p-2 rounded-full hover:bg-[#faf5d0]"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="w-full max-w-[440px] bg-[#faf5d0]/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#d4cc9a] shadow-2xl relative z-10 animate-fade-in-up">
        
        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 p-1 bg-[#e8e2b8] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('citizen')}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'citizen'
                ? 'bg-[#fefae0] text-[#283618] shadow-sm'
                : 'text-[#606c38] hover:text-[#283618]'
            }`}
          >
            <User size={15} />
            <span>Citizen Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('officer')}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'officer'
                ? 'bg-[#283618] text-[#fefae0] shadow-sm'
                : 'text-[#606c38] hover:text-[#283618]'
            }`}
          >
            <Shield size={15} />
            <span>GVMC Officer</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#dda15e] to-[#bc6c25] flex items-center justify-center mb-3 text-[#fefae0] shadow-md">
            {activeTab === 'citizen' ? <User size={24} /> : <Shield size={24} />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#283618]">
            {activeTab === 'citizen' ? 'Citizen Grievance Portal' : 'GVMC Officer Authorization'}
          </h1>
          <p className="text-xs text-[#606c38] mt-1 uppercase tracking-widest font-semibold">
            VizagOps Unify Platform
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 p-3.5 bg-[#bc6c25]/10 border border-[#bc6c25]/30 text-[#bc6c25] text-xs rounded-2xl flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Google Sign In for Citizens */}
        {activeTab === 'citizen' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full bg-white border border-[#d4cc9a] hover:border-[#bc6c25] text-gray-800 font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
            >
              {googleLoading ? (
                <div className="flex items-center gap-2 text-xs text-[#606c38]">
                  <div className="w-4 h-4 border-2 border-[#bc6c25] border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google Account...</span>
                </div>
              ) : (
                <>
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-xs font-bold">Sign in with Google</span>
                </>
              )}
            </button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#d4cc9a]/60"></div>
              </div>
              <span className="relative px-3 bg-[#faf5d0] text-[10px] font-bold text-[#8a9460] uppercase tracking-widest">
                Or Sign In With Email
              </span>
            </div>
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#606c38] font-bold uppercase tracking-widest block pl-1">
              {activeTab === 'citizen' ? 'Citizen Email Address' : 'Officer Account Email'}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9460]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                placeholder={activeTab === 'citizen' ? "citizen@gmail.com" : "admin@vizagops.gov.in"}
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl pl-10 pr-4 py-3 text-xs text-[#283618] focus:ring-2 focus:ring-[#dda15e] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#606c38] font-bold uppercase tracking-widest block pl-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9460]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                placeholder="••••••••"
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl pl-10 pr-4 py-3 text-xs text-[#283618] focus:ring-2 focus:ring-[#dda15e] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-[#dda15e] to-[#bc6c25] text-[#fefae0] font-bold py-3.5 rounded-xl mt-2 transition-all hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#bc6c25]/20 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to {activeTab === 'citizen' ? 'Citizen Portal' : 'Admin Dashboard'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo */}
        <div className="mt-6 pt-5 border-t border-[#d4cc9a]/50 flex flex-col gap-2">
          <p className="text-[10px] text-[#8a9460] font-bold uppercase tracking-widest mb-1 text-center">
            Instant Demo Quick-Fill
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleQuickFillResident}
              disabled={loading || googleLoading}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                activeTab === 'citizen'
                  ? 'bg-[#bc6c25] text-[#fefae0]'
                  : 'bg-[#606c38]/15 text-[#606c38] hover:bg-[#606c38]/25'
              }`}
            >
              Citizen Demo
            </button>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              disabled={loading || googleLoading}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                activeTab === 'officer' && email === 'admin@vizagops.gov.in'
                  ? 'bg-[#283618] text-[#fefae0]'
                  : 'bg-[#dda15e]/20 text-[#bc6c25] hover:bg-[#dda15e]/30'
              }`}
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={handleQuickFillWardOfficer}
              disabled={loading || googleLoading}
              className="px-3 py-1.5 bg-[#283618]/10 text-[#283618] text-xs font-bold rounded-xl hover:bg-[#283618]/20 transition-colors"
            >
              Ward Officer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
