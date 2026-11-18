import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación rápida en el navegador (el servidor vuelve a validar)
    if (!/^[a-z0-9_]{3,20}$/.test(form.username)) {
      return setError('El usuario debe tener 3-20 caracteres: letras minúsculas, números o _');
    }
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');

    setSending(true);
    try {
      const { confirm: _confirm, ...data } = form; // quitamos "confirm": no se envía
      await register(data);
      navigate('/grupos', { replace: true }); // el aviso de "confirma tu correo" aparece arriba
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCard title="Crea tu cuenta" subtitle="Crea grupos con tus amigos, apuntad películas y dejad que la ruleta decida">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Nombre" id="name" autoComplete="name"
          value={form.name} onChange={handleChange} required />
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-zinc-300">Nombre de usuario</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
            <input
              id="username"
              name="username"
              className="input pl-7"
              autoComplete="username"
              placeholder="laura_cine"
              maxLength={20}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              required
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Así te encontrarán tus amigos para añadirte a sus grupos.</p>
        </div>
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
