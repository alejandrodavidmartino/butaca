import mongoose from 'mongoose';

// Diario personal: una película vista por un usuario, con su nota (opcional)
const watchedMovieSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tmdbId: { type: Number, required: true },
    // "Foto" de los datos de TMDB para pintar la lista sin llamar a TMDB
    title: { type: String, required: true },
    poster: String,
    year: String,
    runtime: Number,
    genres: [String],
    score: {
      type: Number,
      min: [1, 'La nota mínima es 1'],
      max: [10, 'La nota máxima es 10'],
      validate: { validator: (v) => v == null || Number.isInteger(v), message: 'La nota debe ser un número entero' },
    },
    comment: { type: String, trim: true, maxlength: [280, 'El comentario puede tener 280 caracteres'], default: '' },
    watchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Un usuario solo puede tener cada película una vez en su diario
watchedMovieSchema.index({ user: 1, tmdbId: 1 }, { unique: true });

export default mongoose.model('WatchedMovie', watchedMovieSchema);
