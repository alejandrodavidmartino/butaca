import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { joinGroup } from '../services/groups';
import { getErrorMessage } from '../services/api';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { VerifyRequired } from '../components/VerifyEmailNotice';

// /unirse/:code -> enlace de invitación. Requiere sesión (ruta protegida):
// si no la tienes, te manda al login y después vuelve aquí.
export default function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { isVerified } = useAuth();

  useEffect(() => {
    if (!isVerified) return;
    joinGroup(code)
      .then((g) => navigate(`/grupos/${g._id}`, { replace: true }))
      .catch((err) => setError(getErrorMessage(err)));
  }, [code, navigate, isVerified]);

  if (!isVerified) {
    return <section className="mx-auto max-w-lg px-4 py-20"><VerifyRequired what="unirte a este grupo (después vuelve a abrir el enlace de invitación)" /></section>;
  }

  if (!error) return <Spinner />;
  return (
    <section className="grid place-items-center px-4 py-32 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="mt-4 text-2xl font-semibold">No hemos podido unirte al grupo</h1>
      <p className="mt-2 text-zinc-400">{error}</p>
      <Link to="/grupos" className="btn-primary mt-8">Ir a mis grupos</Link>
    </section>
  );
}
