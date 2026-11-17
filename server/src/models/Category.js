import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

// Categoría de las colecciones (p. ej. "Ciclos temáticos", "Para ver en familia")
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 40, unique: true },
    slug: { type: String, unique: true },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    emoji: { type: String, default: '🎬', maxlength: 8 },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function () {
  if (this.isModified('name')) this.slug = slugify(this.name);
});

export default mongoose.model('Category', categorySchema);
