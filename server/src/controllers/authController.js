import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

// Crea un token JWT que caduca en 7 días
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
export async function register(req, res) {
  const { name, username, email, password } = req.body;
  if (!username) throw new HttpError(400, 'El nombre de usuario es obligatorio');

  if (await User.exists({ email: email?.toLowerCase() })) {
    throw new HttpError(409, 'Ya existe una cuenta con ese email');
  }
  if (await User.exists({ username: username.toLowerCase() })) {
    throw new HttpError(409, 'Ese nombre de usuario ya está cogido');
  }

  // El rol NO se lee del body: nadie puede registrarse como admin
  const user = await User.create({ name, username, email, password });
  res.status(201).json({ token: signToken(user), user });
}

// POST /api/auth/login
export async function login(req, res) {
  // "login" puede ser el email o el @usuario
  const login = (req.body.login || req.body.email || '').trim().toLowerCase().replace(/^@/, '');
  const { password } = req.body;
  if (!login || !password) throw new HttpError(400, 'Usuario y contraseña son obligatorios');

  // select('+password') porque en el modelo está oculta por defecto
  const user = await User.findOne(login.includes('@') ? { email: login } : { username: login }).select(
    '+password'
  );
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Usuario o contraseña incorrectos');
  }
  if (!user.active) throw new HttpError(403, 'Tu cuenta está desactivada');

  res.json({ token: signToken(user), user });
}

// PATCH /api/auth/me  { name?, username?, bio?, profilePublic?, platforms? }  -> el usuario actualiza su perfil
export async function updateMe(req, res) {
  const { name, platforms, bio, profilePublic } = req.body;
  if (name !== undefined) req.user.name = name;
  if (bio !== undefined) req.user.bio = String(bio);
  if (profilePublic !== undefined) req.user.profilePublic = Boolean(profilePublic);
  if (req.body.username !== undefined) {
    const username = String(req.body.username).trim().toLowerCase().replace(/^@/, '');
    if (username !== req.user.username) {
      if (await User.exists({ username, _id: { $ne: req.user._id } })) {
        throw new HttpError(409, 'Ese nombre de usuario ya está cogido');
      }
      req.user.username = username; // el modelo valida el formato
    }
  }
  if (platforms !== undefined) {
    if (!Array.isArray(platforms)) throw new HttpError(400, 'Plataformas no válidas');
    req.user.platforms = [...new Set(platforms)];
  }
  await req.user.save(); // valida que las plataformas existan (enum del modelo)
  res.json({ user: req.user });
}

// GET /api/auth/me  (requiere estar logueado)
export async function me(req, res) {
  res.json({ user: req.user });
}
