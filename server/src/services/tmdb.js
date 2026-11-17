import axios from 'axios';

// Cliente de TMDB. Admite dos tipos de credencial:
//  - TMDB_READ_TOKEN: "API Read Access Token" (recomendado, va en la cabecera)
//  - TMDB_API_KEY:    "API Key" corta (va como parámetro en la URL)
const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 10000,
  params: { language: 'es-ES' },
});

tmdb.interceptors.request.use((config) => {
  if (process.env.TMDB_READ_TOKEN) {
    config.headers.Authorization = `Bearer ${process.env.TMDB_READ_TOKEN}`;
  } else if (process.env.TMDB_API_KEY) {
    config.params = { ...config.params, api_key: process.env.TMDB_API_KEY };
  }
  return config;
});

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
  overview: m.overview,
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
