import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

// Etiqueta libre para colecciones (p. ej. "terror", "años 80", "para llorar")
const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 30, unique: true },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

tagSchema.pre('validate', function () {
  if (this.isModified('name')) this.slug = slugify(this.name);
});

export default mongoose.model('Tag', tagSchema);
