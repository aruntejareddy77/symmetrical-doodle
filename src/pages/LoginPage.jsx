import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import LottiePlayer from '../components/UI/LottiePlayer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const roleParam = queryParams.get('role') || 'admin';

  // Set default credentials based on role param
  useEffect(() => {
    if (roleParam === 'citizen') {
      setEmail('citizen@gmail.com');
      setPassword('password123');
    } else {
      setEmail('admin@vizagops.gov.in');
      setPassword('password123');
    }
  }, [roleParam]);

  const handleQuickFillAdmin = () => {
    setEmail('admin@vizagops.gov.in');
    setPassword('password123');
    setError('');
  };

  const handleQuickFillWardOfficer = () => {
    setEmail('officer@vizagops.gov.in');
    setPassword('password123');
    setError('');
  };

  const handleQuickFillResident = () => {
    setEmail('citizen@gmail.com');
    setPassword('password123');
    setError('');
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
      // Route based on user role
      const role = result.user?.role?.toUpperCase();
      if (role === 'CITIZEN') {
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
    <div className="min-h-screen w-full bg-[#fefae0] text-[#283618] flex items-center justify-center relative p-6 overflow-hidden">
      {/* Background Aurora */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#dda15e]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#606c38]/15 blur-[100px] pointer-events-none" />

      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold text-[#606c38] hover:text-[#283618] transition-colors p-2 rounded-full hover:bg-[#faf5d0]"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="w-full max-w-[440px] bg-[#faf5d0]/90 backdrop-blur-xl p-8 rounded-3xl border border-[#d4cc9a] shadow-2xl relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#dda15e] to-[#bc6c25] flex items-center justify-center mb-4 text-[#fefae0] shadow-md">
            {roleParam === 'citizen' ? <User size={24} /> : <Shield size={24} />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#283618]">
            {roleParam === 'citizen' ? 'Citizen Portal Sign In' : 'GVMC Officer Authorization'}
          </h1>
          <p className="text-xs text-[#606c38] mt-1.5 uppercase tracking-widest font-semibold">
            VizagOps Unify Platform
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[#bc6c25]/10 border border-[#bc6c25]/30 text-[#bc6c25] text-xs rounded-2xl flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#606c38] font-bold uppercase tracking-widest block pl-1">
              Account Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9460]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="email@vizagops.gov.in"
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl pl-10 pr-4 py-3 text-xs text-[#283618] focus:ring-2 focus:ring-[#dda15e] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#606c38] font-bold uppercase tracking-widest block pl-1">
              Secret Passphrase
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9460]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                className="w-full bg-[#fefae0] border border-[#d4cc9a] rounded-xl pl-10 pr-4 py-3 text-xs text-[#283618] focus:ring-2 focus:ring-[#dda15e] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#dda15e] to-[#bc6c25] text-[#fefae0] font-bold py-3.5 rounded-xl mt-2 transition-all hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#bc6c25]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Authorizing...</span>
            ) : (
              <>
                <span>Authorize & Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo */}
        <div className="mt-8 pt-6 border-t border-[#d4cc9a]/50 flex flex-col gap-2">
          <p className="text-[10px] text-[#8a9460] font-bold uppercase tracking-widest mb-1 text-center">
            Demo Accounts Quick-Select
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              disabled={loading}
              className="px-3 py-2 bg-[#dda15e]/20 text-[#bc6c25] text-xs font-bold rounded-xl hover:bg-[#dda15e]/30 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={handleQuickFillWardOfficer}
              disabled={loading}
              className="px-3 py-2 bg-[#283618]/10 text-[#283618] text-xs font-bold rounded-xl hover:bg-[#283618]/20 transition-colors"
            >
              Ward Officer
            </button>
            <button
              type="button"
              onClick={handleQuickFillResident}
              disabled={loading}
              className="px-3 py-2 bg-[#606c38]/15 text-[#606c38] text-xs font-bold rounded-xl hover:bg-[#606c38]/25 transition-colors"
            >
              Citizen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
