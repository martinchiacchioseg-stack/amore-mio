import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('amoremio_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('amoremio_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('amoremio_token', token);
      localStorage.setItem('amoremio_user', JSON.stringify(user));
      setLoading(false);
      return { success: true, user };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        error: err.response?.data?.error
          ? err.response.data.error + (err.response.data.detail ? ` (${err.response.data.detail})` : '')
          : err.response
            ? `El servidor no respondió correctamente (código ${err.response.status}).`
            : 'No hay conexión con el servidor.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('amoremio_token');
    localStorage.removeItem('amoremio_user');
  };

  const updatePasswordState = (newMustChange) => {
    if (user) {
      const updatedUser = { ...user, must_change_password: newMustChange ? 1 : 0 };
      setUser(updatedUser);
      localStorage.setItem('amoremio_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updatePasswordState }}>
      {children}
    </AuthContext.Provider>
  );
}
