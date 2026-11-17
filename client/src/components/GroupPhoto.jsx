import { useEffect, useRef, useState } from 'react';
import { deleteGroupImage, uploadGroupImage } from '../services/groups';
import { getErrorMessage } from '../services/api';
import { resizeImage } from '../utils/resizeImage';
import GroupAvatar from './GroupAvatar';

// Foto grande del grupo en su página. El creador puede cambiarla o quitarla.
export default function GroupPhoto({ group, canEdit, onChange, onError }) {
  const input = useRef(null);
  const menuRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);

  // Cerrar el menú al pulsar fuera
  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // para poder elegir la misma foto otra vez
    if (!file) return;
    setBusy(true);
    setMenu(false);
    try {
      const image = await resizeImage(file); // la reducimos en el navegador
      onChange(await uploadGroupImage(group._id, image));
    } catch (err) {
      onError(err.response ? getErrorMessage(err) : err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setMenu(false);
    setBusy(true);
    try {
      onChange(await deleteGroupImage(group._id));
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const avatar = <GroupAvatar group={group} className="h-24 w-24 rounded-2xl text-5xl sm:h-28 sm:w-28" />;
  if (!canEdit) return avatar;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => (group.imageVersion ? setMenu(!menu) : input.current.click())}
        className="group/photo relative block rounded-2xl focus-visible:outline-2 focus-visible:outline-butaca-500"
        aria-label={group.imageVersion ? 'Cambiar o quitar la foto del grupo' : 'Subir una foto para el grupo'}
        aria-expanded={group.imageVersion ? menu : undefined}
      >
        {avatar}
        {/* Capa al pasar el ratón */}
        <span className={`absolute inset-0 grid place-items-center rounded-2xl bg-black/60 text-center text-xs font-medium text-white transition ${busy ? 'opacity-100' : 'opacity-0 group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100'}`}>
          {busy ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-label="Subiendo foto" />
          ) : (
            <span>📷<br />{group.imageVersion ? 'Cambiar' : 'Subir foto'}</span>
          )}
        </span>
        {/* Botoncito de cámara siempre visible (en móvil no hay "pasar el ratón") */}
        {!busy && (
          <span className="absolute -bottom-1.5 -right-1.5 grid h-8 w-8 place-items-center rounded-full border-2 border-sala bg-butaca-500 text-sm shadow-lg" aria-hidden="true">📷</span>
        )}
      </button>

      {menu && (
        <div className="absolute left-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-telon shadow-2xl">
          <button onClick={() => input.current.click()} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-white/5">📷 Cambiar foto</button>
          <button onClick={remove} className="block w-full px-4 py-2.5 text-left text-sm text-red-300 hover:bg-white/5">🗑 Quitar foto (usar emoji)</button>
        </div>
      )}

      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*" className="hidden" onChange={pick} />
    </div>
  );
}
