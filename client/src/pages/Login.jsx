import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const user = await login(form.email, form.password);
      // Volvemos a la página que quería ver, o a su zona / al panel si es admin
      const fallback = user.role === 'admin' ? '/admin' : '/mi-butaca';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCard title="Bienvenido de nuevo" subtitle="Tu butaca te estaba esperando">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Email" id="email" type="email" autoComplete="email"
          value={form.email} onChange={handleChange} required />
        <FormField label="Contraseña" id="password" type="password" autoComplete="current-password"
          value={form.password} onChange={handleChange} required />

        {error && <p role="alert" className="alert-error">{error}</p>}

        <button type="submit" className="btn-primary w-full py-3" disabled={sending}>
          {sending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-butaca-500 hover:underline">Regístrate gratis</Link>
      </p>
    </AuthCard>
  );
}
