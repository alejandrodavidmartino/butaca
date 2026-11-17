import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { discoverMovies, getGenres, getRandomMovie, searchMovies } from '../services/movies';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';
import ErrorMessage from '../components/ErrorMessage';

const SORTS = [
  ['popularity.desc', 'Más populares'],
  ['vote_average.desc', 'Mejor valoradas'],
  ['primary_release_date.desc', 'Más recientes'],
  ['revenue.desc', 'Más taquilleras'],
];

// Catálogo: buscador + filtros. El estado vive en la URL (?q=&genre=&sort=&page=)
// para que se pueda compartir el enlace y funcione el botón "atrás".
export default function Movies() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const genre = params.get('genre') || '';
  const sort = params.get('sort') || 'popularity.desc';
  const page = Number(params.get('page')) || 1;

  const [text, setText] = useState(q);
  const [surprising, setSurprising] = useState(false);
  const navigate = useNavigate();

  // "Sorpréndeme": película buena al azar (del género elegido, si hay)
  const surprise = async () => {
    setSurprising(true);
    try {
      const movie = await getRandomMovie(genre || undefined);
      navigate(`/pelicula/${movie.id}`);
    } catch {
      setSurprising(false);
    }
  };
  useEffect(() => setText(q), [q]);

  const genres = useFetch(getGenres);
  const movies = useFetch(
    () => (q ? searchMovies(q, page) : discoverMovies({ genre, sort, page })),
    [q, genre, sort, page]
  );

  // Cambia uno o varios filtros y vuelve a la página 1
  const update = (changes) => {
    const next = { q, genre, sort, page: 1, ...changes };
    // Quitamos los valores vacíos o por defecto para que la URL quede limpia
    const clean = Object.fromEntries(
      Object.entries(next).filter(([k, v]) => v && !(k === 'page' && v === 1) && !(k === 'sort' && v === 'popularity.desc'))
    );
    setParams(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    update({ q: text.trim(), genre: '', sort: '' });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl tracking-wide">Películas</h1>
        <button onClick={surprise} disabled={surprising} className="btn-ghost border-butaca-500/50">
          {surprising ? 'Buscando…' : '🎲 Sorpréndeme'}
        </button>
      </div>

      {/* ---------- Buscador ---------- */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Buscar película</label>
        <input
          id="q"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Busca por título: Amélie, Interstellar, El viaje de Chihiro…"
          className="input flex-1"
        />
        <button className="btn-primary px-5">Buscar</button>
      </form>

      {/* ---------- Filtros (solo cuando no se está buscando) ---------- */}
      {q ? (
        <p className="mt-6 text-zinc-400">
          Resultados para <strong className="text-white">«{q}»</strong>
          {movies.data && ` · ${movies.data.totalResults} películas`} ·{' '}
          <button onClick={() => update({ q: '' })} className="text-butaca-500 hover:underline">
            Limpiar búsqueda
          </button>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => update({ genre: '' })} className={chip(!genre)}>Todas</button>
            {genres.data?.map((g) => (
              <button key={g.id} onClick={() => update({ genre: String(g.id) })} className={chip(genre === String(g.id))}>
                {g.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-zinc-400">Ordenar por</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="input w-auto py-1.5"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ---------- Resultados ---------- */}
      {movies.error ? (
        <ErrorMessage message={movies.error} />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movies.loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-telon" />
                ))
              : movies.data.results.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>

          {!movies.loading && movies.data.results.length === 0 && (
            <p className="py-16 text-center text-zinc-400">No hemos encontrado películas. Prueba con otro título.</p>
          )}

          {movies.data && (
            <Pagination page={page} totalPages={movies.data.totalPages} onChange={(p) => update({ page: p })} />
          )}
        </>
      )}
    </section>
  );
}

const chip = (active) =>
  `rounded-full border px-3 py-1 text-sm transition ${
    active
      ? 'border-butaca-500 bg-butaca-500 text-white'
      : 'border-white/10 text-zinc-300 hover:border-white/30 hover:text-white'
  }`;
