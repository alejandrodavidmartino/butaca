import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

// Colección destacada: el CONTENIDO que gestiona el administrador desde el Back-Office
// y que se publica en la parte pública (portada y /colecciones).
const collectionMovieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    poster: String,
    backdrop: String,
    year: String,
    rating: Number,
    note: { type: String, trim: true, maxlength: 200, default: '' }, // comentario del editor
  },
  { _id: false }
);

const collectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 80 },
    slug: { type: String, unique: true },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    emoji: { type: String, default: '🎞️', maxlength: 8 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    movies: [collectionMovieSchema],
    published: { type: Boolean, default: false }, // borrador hasta que se publica
    featured: { type: Boolean, default: false }, // aparece en la portada
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Slug único a partir del título: "ciclo-de-terror", "ciclo-de-terror-2"...
collectionSchema.pre('validate', async function () {
  if (!this.isModified('title') && this.slug) return;
  const base = slugify(this.title) || 'coleccion';
  let slug = base;
  for (let i = 2; await this.constructor.exists({ slug, _id: { $ne: this._id } }); i++) slug = `${base}-${i}`;
  this.slug = slug;
});

collectionSchema.index({ published: 1, featured: -1, updatedAt: -1 });

export default mongoose.model('Collection', collectionSchema);
