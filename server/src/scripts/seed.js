// Crea contenido de ejemplo para el Back-Office: categorías, etiquetas y colecciones.
// Uso: npm run seed   (no duplica nada si ya existe)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import Collection from '../models/Collection.js';
import User from '../models/User.js';
import { getMovieDetail } from '../services/tmdb.js';

const CATEGORIES = [
  { name: 'Ciclos temáticos', emoji: '🎞️', description: 'Selecciones alrededor de un tema o un género' },
  { name: 'Para ver en familia', emoji: '👨‍👩‍👧', description: 'Aptas para todos los públicos' },
  { name: 'Joyas escondidas', emoji: '💎', description: 'Películas que merecen mucha más fama' },
];

const TAGS = ['Terror', 'Años 80', 'Animación', 'Ciencia ficción', 'Para llorar', 'Clásicos', 'Comedia'];

const COLLECTIONS = [
  {
    title: 'Ciclo de terror', emoji: '🎃', category: 'Ciclos temáticos', tags: ['Terror', 'Clásicos'], featured: true,
    description: 'Apaga la luz, sube el volumen y no mires debajo de la butaca. Los clásicos que inventaron el miedo moderno.',
    movies: [[694, 'El hotel más inquietante del cine'], [348, 'En el espacio nadie puede oír tus gritos'], [1091, 'Paranoia en estado puro'], [539], [4232], [493922]],
  },
  {
    title: 'Clásicos de los 80', emoji: '📼', category: 'Ciclos temáticos', tags: ['Años 80', 'Clásicos'], featured: true,
    description: 'Hombreras, sintetizadores y aventuras que marcaron a una generación. Perfectas para una noche de nostalgia.',
    movies: [[105, 'Imprescindible en cualquier maratón'], [9340], [85], [601], [2108], [620]],
  },
  {
    title: 'Pixar para llorar a gusto', emoji: '😭', category: 'Para ver en familia', tags: ['Animación', 'Para llorar'], featured: true,
    description: 'Ten los pañuelos a mano: historias para niños que dejan a los adultos hechos polvo.',
    movies: [[14160, 'Los primeros diez minutos lo dicen todo'], [354912], [150540], [10193], [12]],
  },
  {
    title: 'Ciencia ficción que te vuela la cabeza', emoji: '🚀', category: 'Joyas escondidas', tags: ['Ciencia ficción'], featured: false,
    description: 'Ideas grandes, giros imposibles y debates hasta las tantas al salir del cine.',
    movies: [[329865], [264660], [14337], [37165], [62]],
  },
];

await connectDB();
const admin = await User.findOne({ role: 'admin' });

const cats = {};
for (const c of CATEGORIES) {
  cats[c.name] = (await Category.findOne({ name: c.name })) || (await Category.create(c));
}
const tags = {};
for (const name of TAGS) tags[name] = (await Tag.findOne({ name })) || (await Tag.create({ name }));
console.log(`🏷️  ${CATEGORIES.length} categorías y ${TAGS.length} etiquetas listas`);

for (const c of COLLECTIONS) {
  if (await Collection.exists({ title: c.title })) {
    console.log(`·  "${c.title}" ya existe`);
    continue;
  }
  const movies = [];
  for (const [tmdbId, note = ''] of c.movies) {
    try {
      const m = await getMovieDetail(tmdbId);
      movies.push({ tmdbId, title: m.title, poster: m.poster, backdrop: m.backdrop, year: m.year, rating: m.rating, note });
    } catch {
      console.warn(`   (no se pudo cargar la película ${tmdbId} de TMDB)`);
    }
  }
  await Collection.create({
    title: c.title, emoji: c.emoji, description: c.description, category: cats[c.category]._id,
    tags: c.tags.map((t) => tags[t]._id), movies, published: true, featured: c.featured, createdBy: admin?._id,
  });
  console.log(`✅ Colección "${c.title}" con ${movies.length} películas`);
}

await mongoose.disconnect();
