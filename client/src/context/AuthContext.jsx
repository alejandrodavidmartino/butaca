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

  // "login" puede ser el email o el @usuario
  const login = async (login, password) =>
    saveSession((await api.post('/auth/login', { login, password })).data);

  const register = async (form) => saveSession((await api.post('/auth/register', form)).data);

  // Actualiza datos del perfil (p. ej. las plataformas que tiene)
  const updateProfile = async (fields) => {
    const { data } = await api.patch('/auth/me', fields);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('butaca_token');
    setUser(null);
  };

  // Foto de perfil, contraseña y borrado de cuenta
  const uploadAvatar = async (image) => setUser((await api.put('/auth/me/avatar', { image })).data.user);
  const removeAvatar = async () => setUser((await api.delete('/auth/me/avatar')).data.user);
  const changePassword = (current, next) => api.patch('/auth/me/password', { current, next }).then((r) => r.data);
  const deleteAccount = async (password) => {
    await api.delete('/auth/me', { data: { password } });
    logout();
  };
  const generateTaste = async () => setUser((await api.post('/users/me/taste', null, { timeout: 60000 })).data.user);

  // Verificación del correo
  const resendVerification = async () => {
    const { data } = await api.post('/auth/resend-verification');
    setUser(data.user);
    return data.message;
  };
  const verifyEmail = async (token) => {
    const { data } = await api.post('/auth/verify-email', { token });
    // Si el que confirma es el usuario con sesión abierta, actualizamos su estado al momento
    setUser((u) => (u && u._id === data.user._id ? data.user : u));
    return data;
  };

  const isAdmin = user?.role === 'admin';
  const value = {
    user, loading, login, register, logout, updateProfile, uploadAvatar, removeAvatar,
    changePassword, deleteAccount, generateTaste, resendVerification, verifyEmail, isAdmin,
    // Los admins no necesitan confirmar el correo
    isVerified: Boolean(user && (user.emailVerified || isAdmin)),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar la sesión desde cualquier componente: const { user } = useAuth()
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
