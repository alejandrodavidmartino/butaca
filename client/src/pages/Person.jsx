import { useState } from 'react';
import { useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getPerson } from '../services/movies';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import MovieRow from '../components/MovieRow';
import MovieCard from '../components/MovieCard';

const formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

// Edad: hasta hoy o hasta la fecha de fallecimiento
function age(birthday, deathday) {
  const end = deathday ? new Date(deathday) : new Date();
  const b = new Date(birthday);
  let years = end.getFullYear() - b.getFullYear();
  if (end < new Date(end.getFullYear(), b.getMonth(), b.getDate())) years--;
  return years;
}

const PAGE = 24; // películas que se ven de la filmografía antes de pulsar «Ver más»

// /persona/:id -> actor, actriz, director… con biografía y filmografía (datos de TMDB)
export default function Person() {
  const { id } = useParams();
  const { data: person, loading, error } = useFetch(() => getPerson(id), [id]);
  const [bioOpen, setBioOpen] = useState(false);
  const [shown, setShown] = useState(PAGE);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const longBio = person.biography.length > 600;

  return (
    <article>
      <header className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 md:flex-row">
        <div className="mx-auto w-48 shrink-0 md:mx-0 md:w-64">
          {person.photo ? (
            <img src={person.photo} alt={person.name} className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10" />
          ) : (
            <div className="grid aspect-[2/3] place-items-center rounded-2xl bg-telon text-6xl">🎭</div>
          )}
        </div>

        <div className="flex-1">
          {person.department && (
            <p className="text-xs font-semibold uppercase tracking-widest text-butaca-500">{person.department}</p>
          )}
          <h1 className="mt-1 font-display text-5xl leading-none tracking-wide sm:text-7xl">{person.name}</h1>

          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {person.birthday && (
              <div>
                <dt className="text-zinc-500">Nacimiento</dt>
                <dd className="text-zinc-200">
                  {formatDate(person.birthday)}
                  {!person.deathday && ` (${age(person.birthday)} años)`}
                </dd>
              </div>
            )}
            {person.deathday && (
              <div>
                <dt className="text-zinc-500">Fallecimiento</dt>
                <dd className="text-zinc-200">{formatDate(person.deathday)} ({age(person.birthday, person.deathday)} años)</dd>
              </div>
            )}
            {person.placeOfBirth && (
              <div>
                <dt className="text-zinc-500">Lugar</dt>
                <dd className="text-zinc-200">{person.placeOfBirth}</dd>
              </div>
            )}
            <div>
              <dt className="text-zinc-500">Películas</dt>
              <dd className="text-zinc-200">{person.movies.length}</dd>
            </div>
          </dl>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-zinc-400">Biografía</h2>
          {person.biography ? (
            <>
              {person.biographyLang === 'en' && <p className="mt-1 text-xs text-zinc-500">No hay biografía en español; te la mostramos en inglés.</p>}
              <p className={`mt-2 max-w-3xl whitespace-pre-line leading-relaxed text-zinc-200 ${longBio && !bioOpen ? 'line-clamp-6' : ''}`}>
                {person.biography}
              </p>
              {longBio && (
                <button onClick={() => setBioOpen(!bioOpen)} className="mt-2 text-sm font-medium text-butaca-500 hover:underline">
                  {bioOpen ? 'Leer menos' : 'Leer más'}
                </button>
              )}
            </>
          ) : (
            <p className="mt-2 text-zinc-500">TMDB todavía no tiene su biografía.</p>
          )}
        </div>
      </header>

      {person.knownFor.length > 2 && <MovieRow title="Conocido por" movies={person.knownFor} />}

      {person.movies.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <h2 className="font-display text-3xl tracking-wide">Filmografía</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {person.movies.slice(0, shown).map((m) => (
              <li key={m.id}>
                <MovieCard movie={m} />
                {m.role && <p className="line-clamp-1 text-xs text-zinc-400" title={m.role}>{m.role}</p>}
              </li>
            ))}
          </ul>
          {shown < person.movies.length && (
            <div className="mt-6 text-center">
              <button onClick={() => setShown(shown + PAGE)} className="btn-ghost">
                Ver más ({person.movies.length - shown})
              </button>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
