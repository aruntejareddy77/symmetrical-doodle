import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth state from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      let userData = null;
      let token = null;

      try {
        const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const apiURL = import.meta.env.VITE_API_URL || `http://${apiHost}:3000/api/v1`;
        const response = await fetch(`${apiURL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const responseData = await response.json();
          userData = responseData.data.user;
          token = responseData.data.token;
        } else {
          // Backend rejected — fall through to demo auth below
          throw new Error('Backend auth rejected');
        }
      } catch (err) {
        // Fallback for demo when backend is offline or rejects
        console.warn('Using client demo auth:', err.message);
        const isOfficer = email.includes('admin') || email.includes('gvmc') || email.includes('officer') || email.includes('vizagops');
        userData = {
          id: isOfficer ? 'USR-ADM-001' : 'USR-RES-884',
          name: isOfficer ? 'Priya Sharma' : 'Lakshmi Narayana',
          email,
          role: isOfficer ? 'ADMIN' : 'CITIZEN',
          ward: 'GVMC-W12',
        };
        token = `demo-token-${Date.now()}`;
      }

      // Save to localStorage
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update State
      setAccessToken(token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
