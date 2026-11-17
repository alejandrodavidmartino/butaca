import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: 50,
    },
    username: {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_]{3,20}$/, 'El usuario debe tener 3-20 caracteres: letras, números o _'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El email no es válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // nunca se devuelve en las consultas salvo que se pida
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    active: { type: Boolean, default: true }, // el admin puede bloquear usuarios
    avatar: { type: String, default: '' },
    favoriteGenres: [{ type: Number }], // ids de géneros de TMDB
  },
  { timestamps: true } // añade createdAt y updatedAt
);

// Si un usuario no tiene @usuario (cuentas antiguas o admins creados por script),
// generamos uno a partir del email: ana.lopez@gmail.com -> ana_lopez_4821
userSchema.pre('validate', function () {
  if (this.username || !this.email) return;
  const base = this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 15);
  this.username = `${base.padEnd(3, '_')}_${Math.floor(1000 + Math.random() * 9000)}`;
});

// Antes de guardar, ciframos la contraseña si ha cambiado
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Método para comparar la contraseña escrita con la cifrada
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Al convertir a JSON quitamos la contraseña por seguridad
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
