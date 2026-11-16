import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación rápida en el navegador (el servidor vuelve a validar)
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');

    setSending(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/mi-butaca', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCard title="Crea tu cuenta" subtitle="Guarda favoritos, escribe reseñas y pide recomendaciones a la IA">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Nombre" id="name" autoComplete="name"
          value={form.name} onChange={handleChange} required />
        <FormField label="Email" id="email" type="email" autoComplete="email"
          value={form.email} onChange={handleChange} required />
        <FormField label="Contraseña" id="password" type="password" autoComplete="new-password"
          placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} required />
        <FormField label="Repite la contraseña" id="confirm" type="password" autoComplete="new-password"
          value={form.confirm} onChange={handleChange} required />

        {error && <p role="alert" className="alert-error">{error}</p>}

        <button type="submit" className="btn-primary w-full py-3" disabled={sending}>
          {sending ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-butaca-500 hover:underline">Inicia sesión</Link>
      </p>
    </AuthCard>
  );
}
