import { Router } from 'express';
import Collection from '../models/Collection.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import { HttpError } from '../utils/httpError.js';

// Parte PÚBLICA de las colecciones: solo se ven las publicadas
const router = Router();

// GET /api/collections?category=slug&tag=slug&featured=1
router.get('/', async (req, res) => {
  const filter = { published: true };
  if (req.query.featured) filter.featured = true;
  if (req.query.category) {
    const cat = await Category.findOne({ slug: req.query.category });
    filter.category = cat?._id || null;
  }
  if (req.query.tag) {
    const tag = await Tag.findOne({ slug: req.query.tag });
    filter.tags = tag?._id || null;
  }
  const items = await Collection.find(filter)
    .sort({ featured: -1, updatedAt: -1 })
    .populate('category', 'name slug emoji')
    .populate('tags', 'name slug')
    .lean();
  // En el listado no hace falta enviar todas las películas: solo unas pocas para la portada
  res.json(items.map((c) => ({ ...c, moviesCount: c.movies.length, movies: c.movies.slice(0, 5) })));
});

// GET /api/collections/categories  -> categorías con al menos una colección publicada
router.get('/categories', async (_req, res) => {
  const used = await Collection.distinct('category', { published: true });
  res.json(await Category.find({ _id: { $in: used } }).sort({ name: 1 }).lean());
});

// GET /api/collections/:slug
router.get('/:slug', async (req, res) => {
  const col = await Collection.findOne({ slug: req.params.slug, published: true })
    .populate('category', 'name slug emoji')
    .populate('tags', 'name slug')
    .populate('createdBy', 'name username')
    .lean();
  if (!col) throw new HttpError(404, 'Colección no encontrada');
  res.json(col);
});

export default router;
