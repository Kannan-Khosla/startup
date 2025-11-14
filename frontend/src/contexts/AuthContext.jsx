import { createContext, useContext, useState, useEffect } from 'react';
import { 
  login as loginApi, 
  register as registerApi, 
  logout as logoutApi,
  getCurrentUser as getCurrentUserApi,
  getUser,
  isAuthenticated as checkAuth,
  getUserRole,
  setToken,
  setUser,
  clearAuth
} from '../services/auth';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (checkAuth()) {
        // Verify token is still valid
        const { data, error } = await getCurrentUserApi();
        if (error || !data) {
          clearAuth();
          setUserState(null);
        } else {
          setUserState(data);
          setUser(data);
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await loginApi(email, password);
    if (err) {
      setError(err);
      setLoading(false);
      return { error: err };
    }
    setUserState(data.user);
    setLoading(false);
    return { data, error: null };
  };

  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await registerApi(email, password, name);
    if (err) {
      setError(err);
      setLoading(false);
      return { error: err };
    }
    setUserState(data.user);
    setLoading(false);
    return { data, error: null };
  };

  const logout = () => {
    logoutApi();
    setUserState(null);
    setError(null);
  };

  const refreshUser = async () => {
    const { data, error: err } = await getCurrentUserApi();
    if (!err && data) {
      setUserState(data);
      setUser(data);
    }
    return { data, error: err };
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: user !== null,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    isCustomer: user?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

