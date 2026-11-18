import mongoose from 'mongoose';

// Historial de un grupo: "Pablo añadió Dune", "Marta puntuó Alien con un 8"…
// Va en su propia colección (y no dentro del grupo) porque crece sin parar
// y no queremos cargarlo cada vez que se abre el grupo.
export const ACTIVITY_TYPES = [
  'created', // creó el grupo
  'joined', // entró con el código
  'member_added', // añadió a otro miembro (target)
  'left', // salió del grupo
  'kicked', // el creador echó a alguien (target)
  'movie_added',
  'movie_watched',
  'movie_rated', // data.score
  'movie_removed',
  'roulette', // la ruleta eligió una película
  'photo_changed',
  'renamed', // data.name = nombre nuevo
];

const activitySchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // quién lo hizo
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // a quién (añadir/expulsar)
    // "Foto" de la película: si luego se quita del grupo, el historial sigue teniendo su título
    movie: { tmdbId: Number, title: String, poster: String },
    data: { score: Number, name: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// "Lo último de este grupo" -> ordenado por fecha dentro de cada grupo
activitySchema.index({ group: 1, createdAt: -1 });
// MongoDB borra solo las entradas de más de un año
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export default mongoose.model('GroupActivity', activitySchema);
