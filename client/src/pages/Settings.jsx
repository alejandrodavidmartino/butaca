import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { resizeImage } from '../utils/resizeImage';
import Avatar from '../components/Avatar';
import PlatformPicker from '../components/PlatformPicker';

// Ajustes de la cuenta: foto, datos del perfil, privacidad, plataformas, contraseña y borrar cuenta
export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();

  // Si llegamos con #plataformas, bajamos a esa sección
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-butaca-500">Tu cuenta</p>
      <h1 className="font-display text-5xl tracking-wide">Ajustes</h1>
      <p className="text-zinc-400">
        Así te ven los demás: <Link to={`/u/${user.username}`} className="text-butaca-500 hover:underline">ver mi perfil</Link>
      </p>

      <div className="mt-8 space-y-6">
        <PhotoSection />
        <ProfileSection />
        <PlatformsSection />
        <PasswordSection />
        <DangerSection />
      </div>
    </section>
  );
}

function Card({ id, title, description, children, danger = false }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-2xl border p-6 ${danger ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-telon'}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Mensaje de "guardado" que desaparece solo
function useFlash() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(0);
  const flash = (text, type = 'ok') => {
    clearTimeout(timer.current);
    setMsg({ text, type });
    if (type === 'ok') timer.current = setTimeout(() => setMsg(null), 2500);
  };
  const node = msg && (
    <p role={msg.type === 'ok' ? 'status' : 'alert'} className={msg.type === 'ok' ? 'text-sm text-emerald-400' : 'alert-error'}>
      {msg.type === 'ok' ? '✓ ' : ''}{msg.text}
    </p>
  );
  return [flash, node];
}

// ---------- Foto de perfil ----------
function PhotoSection() {
  const { user, uploadAvatar, removeAvatar } = useAuth();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [flash, message] = useFlash();

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await uploadAvatar(await resizeImage(file, 320)); // 320×320 es de sobra para un avatar
      flash('Foto actualizada');
    } catch (err) {
      flash(err.response ? getErrorMessage(err) : err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Foto de perfil" description="Se recorta en círculo automáticamente. La verán tus grupos y quien visite tu perfil.">
      <div className="flex flex-wrap items-center gap-5">
        <button type="button" onClick={() => input.current.click()} className="group relative rounded-full" aria-label="Cambiar foto de perfil">
          <Avatar user={user} size="h-24 w-24 text-3xl" />
          <span className={`absolute inset-0 grid place-items-center rounded-full bg-black/60 text-xs text-white transition ${busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {busy ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : '📷 Cambiar'}
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current.click()} className="btn-primary" disabled={busy}>
            {user.avatarVersion ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {user.avatarVersion && (
            <button type="button" onClick={async () => { await removeAvatar(); flash('Foto quitada'); }} className="btn-ghost text-zinc-400">
              Quitar
            </button>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
      </div>
      <div className="mt-3">{message}</div>
    </Card>
  );
}

// ---------- Datos del perfil y privacidad ----------
function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, username: user.username, bio: user.bio || '', profilePublic: user.profilePublic !== false });
  const [saving, setSaving] = useState(false);
  const [flash, message] = useFlash();
  const changed =
    form.name !== user.name || form.username !== user.username || form.bio !== (user.bio || '') || form.profilePublic !== (user.profilePublic !== false);

  const save = async (e) => {
    e.preventDefault();
    if (!/^[a-z0-9_]{3,20}$/.test(form.username)) return flash('El usuario debe tener 3-20 caracteres: letras minúsculas, números o _', 'error');
    setSaving(true);
    try {
      await updateProfile({ ...form, name: form.name.trim(), bio: form.bio.trim() });
      flash('Perfil guardado');
    } catch (err) {
      flash(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Tu perfil">
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sname" className="mb-1.5 block text-sm font-medium text-zinc-300">Nombre</label>
            <input id="sname" className="input" maxLength={50} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="suser" className="mb-1.5 block text-sm font-medium text-zinc-300">Nombre de usuario</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
              <input id="suser" className="input pl-7" maxLength={20} value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="sbio" className="mb-1.5 block text-sm font-medium text-zinc-300">Bio</label>
          <textarea id="sbio" rows={2} maxLength={160} className="input resize-none" placeholder="Fan de Miyazaki, del terror de los 80 y de llorar con Pixar"
            value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <p className="text-right text-xs text-zinc-500">{form.bio.length}/160</p>
        </div>

        {/* Interruptor de privacidad */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/5 p-4">
          <input type="checkbox" className="peer sr-only" checked={form.profilePublic} onChange={(e) => setForm({ ...form, profilePublic: e.target.checked })} />
          <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-zinc-600 transition peer-checked:bg-butaca-500 peer-focus-visible:ring-2 peer-focus-visible:ring-butaca-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
          <span>
            <span className="block text-sm font-medium">Perfil visible para otros usuarios</span>
            <span className="block text-xs text-zinc-400">
              {form.profilePublic
                ? 'Cualquier usuario registrado puede ver tus estadísticas, tu top 3 y tus géneros favoritos.'
                : 'Solo se verá tu nombre y tu foto. Tus notas en los grupos siguen siendo visibles para ese grupo.'}
            </span>
          </span>
        </label>

        <div className="flex items-center justify-between gap-3">
          <div>{message}</div>
          <button className="btn-primary" disabled={!changed || saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Card>
  );
}

// ---------- Plataformas ----------
function PlatformsSection() {
  const { user, updateProfile } = useAuth();
  const [platforms, setPlatforms] = useState(user.platforms || []);
  const [flash, message] = useFlash();
  const timer = useRef(0);

  const change = (next) => {
    setPlatforms(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updateProfile({ platforms: next });
        flash('Plataformas guardadas');
      } catch (err) {
        flash(getErrorMessage(err), 'error');
      }
    }, 500);
  };

  return (
    <Card id="plataformas" title="Mis plataformas" description="Ratatús solo te recomendará películas que puedas ver en ellas.">
      <PlatformPicker value={platforms} onChange={change} />
      <div className="mt-3 h-5">{message}</div>
    </Card>
  );
}

// ---------- Contraseña ----------
function PasswordSection() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [flash, message] = useFlash();

  const save = async (e) => {
    e.preventDefault();
    if (form.next.length < 6) return flash('La nueva contraseña debe tener al menos 6 caracteres', 'error');
    if (form.next !== form.confirm) return flash('Las contraseñas nuevas no coinciden', 'error');
    setSaving(true);
    try {
      await changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      flash('Contraseña cambiada');
    } catch (err) {
      flash(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Contraseña">
      <form onSubmit={save} className="space-y-3">
        <div>
          <label htmlFor="pcur" className="mb-1.5 block text-sm font-medium text-zinc-300">Contraseña actual</label>
          <input id="pcur" type="password" autoComplete="current-password" className="input" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pnew" className="mb-1.5 block text-sm font-medium text-zinc-300">Nueva contraseña</label>
            <input id="pnew" type="password" autoComplete="new-password" className="input" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="pconf" className="mb-1.5 block text-sm font-medium text-zinc-300">Repite la nueva</label>
            <input id="pconf" type="password" autoComplete="new-password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>{message}</div>
          <button className="btn-primary" disabled={saving}>{saving ? 'Cambiando…' : 'Cambiar contraseña'}</button>
        </div>
      </form>
    </Card>
  );
}

// ---------- Borrar cuenta ----------
function DangerSection() {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const confirmDelete = async (e) => {
    e.preventDefault();
    try {
      await deleteAccount(password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Card danger title="Borrar mi cuenta" description="Se borrarán tu perfil, tu foto, tus vistas y tus notas en los grupos. No se puede deshacer.">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-ghost border-red-500/40 text-red-300 hover:bg-red-500/10">Quiero borrar mi cuenta</button>
      ) : (
        <form onSubmit={confirmDelete} className="space-y-3">
          <label htmlFor="dpass" className="block text-sm text-zinc-300">Para confirmarlo, escribe tu contraseña:</label>
          <input id="dpass" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          {error && <p role="alert" className="alert-error">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setOpen(false); setPassword(''); setError(''); }} className="btn-ghost">Cancelar</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700">Borrar mi cuenta definitivamente</button>
          </div>
        </form>
      )}
    </Card>
  );
}
