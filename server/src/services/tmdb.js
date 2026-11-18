import axios from 'axios';
import { PLATFORMS, platformForProviderId } from '../config/platforms.js';

// Cliente de TMDB. Admite dos tipos de credencial:
//  - TMDB_READ_TOKEN: "API Read Access Token" (recomendado, va en la cabecera)
//  - TMDB_API_KEY:    "API Key" corta (va como parámetro en la URL)
const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 10000,
  params: { language: 'es-ES' },
});

// Limpia lo que se pega a veces al copiar: espacios, comillas o un "Bearer " de más
const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();

// Detecta qué credencial tenemos, venga en la variable que venga:
// - el "API Read Access Token" es un JWT largo (empieza por "eyJ") -> cabecera Authorization
// - la "API Key" son 32 caracteres hexadecimales -> parámetro ?api_key=
function tmdbCredential() {
  const values = [clean(process.env.TMDB_READ_TOKEN), clean(process.env.TMDB_API_KEY)].filter(Boolean);
  const token = values.find((v) => v.startsWith('eyJ'));
  if (token) return { type: 'token', value: token };
  const key = values.find((v) => /^[a-f0-9]{32}$/i.test(v));
  if (key) return { type: 'key', value: key };
  return values[0] ? { type: 'token', value: values[0] } : null;
}

tmdb.interceptors.request.use((config) => {
  const cred = tmdbCredential();
  if (cred?.type === 'token') config.headers.Authorization = `Bearer ${cred.value}`;
  if (cred?.type === 'key') config.params = { ...config.params, api_key: cred.value };
  return config;
});

// Al arrancar, dejamos en los logs qué tipo de credencial se está usando (sin mostrarla)
export function describeTmdbCredential() {
  const cred = tmdbCredential();
  if (!cred) return 'sin credencial';
  return `${cred.type === 'token' ? 'Read Access Token' : 'API Key'} (${cred.value.length} caracteres)`;
}

const IMG = 'https://image.tmdb.org/t/p';

// ---------- Caché en memoria ----------
// TMDB tiene límite de peticiones: guardamos las respuestas un rato
const cache = new Map();
const TTL = 1000 * 60 * 30; // 30 minutos

async function get(path, params = {}) {
  const key = path + JSON.stringify(params);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < TTL) return hit.data;

  const { data } = await tmdb.get(path, { params });
  cache.set(key, { data, time: Date.now() });
  if (cache.size > 500) cache.delete(cache.keys().next().value); // no crecer sin límite
  return data;
}

// ---------- Limpieza de spam ----------
// TMDB es colaborativa y a veces cuelan publicidad en las sinopsis
// (p. ej. "¿Buscas películas gratis? ¡Busca xxxx.net en Google!"). Quitamos las frases con enlaces o dominios.
const SPAM = /(https?:\/\/|www\.|\b[\w-]+\.(?:net|com|org|tv|to|io|xyz|cc|me|site|online|top)\b|@\w{3,})/i;
// Frases típicas de esta publicidad aunque no lleven dominio
const SPAM_PHRASES = /(pel[ií]culas?\s+y\s+series\s+gratis|ver\s+gratis|\ben\s+google\b|descarga\s+gratis)/i;
export function cleanOverview(text = '') {
  // 1) Quitamos las frases completas que son publicidad
  const bySentence = text
    .split(/(?<=[.!?¡¿])\s+/) // frases
    .filter((sentence) => !SPAM.test(sentence) && !SPAM_PHRASES.test(sentence))
    .join(' ')
    .trim();
  if (bySentence.length > 40 || !SPAM.test(text)) return bySentence;

  // 2) Plan B: si la publicidad va pegada al texto sin punto, borramos solo los trozos de spam
  return text
    .replace(/¿?\s*buscas\s+pel[ií]culas\s+y\s+series\s+gratis\?\s*/gi, '')
    .replace(/¡?\s*busca\s+\S+\s+en\s+google\s*!?\s*/gi, '')
    .replace(/ver\s+gratis\s+\S*\s*@\w+\s*/gi, '')
    .replace(new RegExp(SPAM.source, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ---------- Transformaciones ----------
// Devolvemos al frontend solo lo que necesita, con las URLs de imagen completas
const img = (path, size) => (path ? `${IMG}/${size}${path}` : null);

export const toMovieCard = (m) => ({
  id: m.id,
  title: m.title,
  year: m.release_date?.slice(0, 4) || null,
  rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
  poster: img(m.poster_path, 'w342'),
  backdrop: img(m.backdrop_path, 'w1280'),
  overview: cleanOverview(m.overview),
  genreIds: m.genre_ids || m.genres?.map((g) => g.id) || [],
});

const toPage = (data) => ({
  page: data.page,
  totalPages: Math.min(data.total_pages, 500), // TMDB no deja pasar de la 500
  totalResults: data.total_results,
  results: data.results.map(toMovieCard),
});

// ---------- Funciones públicas ----------
export const getList = async (list, page = 1) => {
  const paths = {
    trending: '/trending/movie/week',
    popular: '/movie/popular',
    now_playing: '/movie/now_playing',
    top_rated: '/movie/top_rated',
    upcoming: '/movie/upcoming',
  };
  return toPage(await get(paths[list], { page, region: 'ES' }));
};

export const searchMovies = async (query, page = 1) =>
  toPage(await get('/search/movie', { query, page, include_adult: false }));

export const discoverMovies = async ({ genre, sort = 'popularity.desc', year, page = 1 }) =>
  toPage(
    await get('/discover/movie', {
      with_genres: genre || undefined,
      primary_release_year: year || undefined,
      sort_by: sort,
      'vote_count.gte': sort.startsWith('vote_average') ? 300 : undefined,
      include_adult: false,
      page,
    })
  );

export const getGenres = async () => (await get('/genre/movie/list')).genres;

export async function getMovieDetail(id) {
  const m = await get(`/movie/${id}`, {
    append_to_response: 'credits,videos,watch/providers,similar,release_dates',
    include_video_language: 'es,en',
  });

  // Tráiler: preferimos uno en español de YouTube
  const videos = m.videos?.results?.filter((v) => v.site === 'YouTube' && v.type === 'Trailer') || [];
  const trailer = videos.find((v) => v.iso_639_1 === 'es') || videos[0];

  // Dónde verla en España
  const es = m['watch/providers']?.results?.ES || {};
  const providers = (list = []) =>
    list.map((p) => ({ id: p.provider_id, name: p.provider_name, logo: img(p.logo_path, 'w92') }));

  // Calificación por edades en España
  const cert = m.release_dates?.results
    ?.find((r) => r.iso_3166_1 === 'ES')
    ?.release_dates.find((d) => d.certification)?.certification;

  return {
    ...toMovieCard(m),
    originalTitle: m.original_title,
    tagline: m.tagline,
    runtime: m.runtime,
    releaseDate: m.release_date,
    genres: m.genres,
    voteCount: m.vote_count,
    certification: cert || null,
    directors: m.credits?.crew?.filter((c) => c.job === 'Director').map((c) => c.name) || [],
    cast:
      m.credits?.cast?.slice(0, 12).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        photo: img(c.profile_path, 'w185'),
      })) || [],
    trailerKey: trailer?.key || null,
    watch: {
      link: es.link || null,
      flatrate: providers(es.flatrate), // suscripción (Netflix, Prime…)
      rent: providers(es.rent),
      buy: providers(es.buy),
    },
    similar: m.similar?.results?.slice(0, 12).map(toMovieCard) || [],
  };
}

// Película aleatoria "buena": nota ≥ 7 y bastantes votos, de una página al azar
export async function randomGoodMovie(genre) {
  const params = {
    sort_by: 'popularity.desc',
    'vote_average.gte': 7,
    'vote_count.gte': 500,
    with_genres: genre || undefined,
    include_adult: false,
  };
  const first = await get('/discover/movie', { ...params, page: 1 });
  const page = 1 + Math.floor(Math.random() * Math.min(first.total_pages, 40));
  const data = page === 1 ? first : await get('/discover/movie', { ...params, page });
  const pool = data.results.filter((m) => m.poster_path);
  return toMovieCard(pool[Math.floor(Math.random() * pool.length)]);
}

// Busca una película por título (y año, si se conoce) y devuelve la más parecida.
// Lo usamos para convertir los títulos que propone la IA en películas reales de TMDB.
export async function findMovie(title, year) {
  const search = (params) => get('/search/movie', { query: title, include_adult: false, ...params });
  let data = year ? await search({ primary_release_year: year }) : null;
  if (!data?.results.length) data = await search({});
  const best = data.results.find((m) => m.poster_path) || data.results[0];
  return best ? toMovieCard(best) : null;
}

// ---------- Plataformas de streaming en España ----------

// Lista de plataformas seleccionables con su logo (los logos los da TMDB)
export async function getPlatforms() {
  const data = await get('/watch/providers/movie', { watch_region: 'ES' });
  return PLATFORMS.map((p) => {
    const provider = data.results.find((r) => r.provider_id === p.ids[0]);
    return { key: p.key, name: p.name, logo: img(provider?.logo_path, 'w92') };
  });
}

// Plataformas de suscripción (agrupadas) donde está una película en España
export async function getMoviePlatforms(movieId) {
  const data = await get(`/movie/${movieId}/watch/providers`);
  const es = data.results?.ES || {};
  const offers = [...(es.flatrate || []), ...(es.free || []), ...(es.ads || [])];
  const found = new Map();
  for (const o of offers) {
    const p = platformForProviderId(o.provider_id);
    if (p && !found.has(p.key)) found.set(p.key, { key: p.key, name: p.name, logo: img(o.logo_path, 'w92') });
  }
  return [...found.values()];
}

// Catálogo de películas bien valoradas disponibles en unas plataformas concretas (para el plan B de Ratatús)
export async function discoverOnPlatforms(platformKeys, pages = 3) {
  const ids = PLATFORMS.filter((p) => platformKeys.includes(p.key)).flatMap((p) => p.ids);
  const params = {
    watch_region: 'ES',
    with_watch_providers: ids.join('|'), // "|" = cualquiera de ellas
    with_watch_monetization_types: 'flatrate|free|ads',
    'vote_count.gte': 200,
    sort_by: 'popularity.desc',
    include_adult: false,
  };
  const results = await Promise.all(Array.from({ length: pages }, (_, i) => get('/discover/movie', { ...params, page: i + 1 })));
  return results.flatMap((r) => r.results).map(toMovieCard);
}

// Petición mínima para comprobar que la credencial funciona (sin caché)
export const tmdbPing = () => tmdb.get('/configuration');
