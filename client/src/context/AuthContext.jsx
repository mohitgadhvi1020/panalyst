import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('broker');
    if (token && saved) {
      try {
        setBroker(JSON.parse(saved));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('broker');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('broker', JSON.stringify(data.broker));
    setBroker(data.broker);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('broker', JSON.stringify(data.broker));
    setBroker(data.broker);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('broker');
    setBroker(null);
  };

  return (
    <AuthContext.Provider value={{ broker, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
