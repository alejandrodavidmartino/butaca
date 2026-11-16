import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Proveedor que envuelve la app y comparte el usuario conectado
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // comprobando si había sesión

  // Al cargar la app, si hay un token guardado, preguntamos al servidor quién somos
  useEffect(() => {
    const token = localStorage.getItem('butaca_token');
    if (!token) return setLoading(false);

    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('butaca_token')) // token caducado
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem('butaca_token', token);
    setUser(user);
    return user;
  };

  const login = async (email, password) =>
    saveSession((await api.post('/auth/login', { email, password })).data);

  const register = async (name, email, password) =>
    saveSession((await api.post('/auth/register', { name, email, password })).data);

  const logout = () => {
    localStorage.removeItem('butaca_token');
    setUser(null);
  };

  const value = { user, loading, login, register, logout, isAdmin: user?.role === 'admin' };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar la sesión desde cualquier componente: const { user } = useAuth()
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
