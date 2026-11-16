import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

// Crea un token JWT que caduca en 7 días
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email: email?.toLowerCase() });
  if (exists) throw new HttpError(409, 'Ya existe una cuenta con ese email');

  // El rol NO se lee del body: nadie puede registrarse como admin
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user), user });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email y contraseña son obligatorios');

  // select('+password') porque en el modelo está oculta por defecto
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }
  if (!user.active) throw new HttpError(403, 'Tu cuenta está desactivada');

  res.json({ token: signToken(user), user });
}

// GET /api/auth/me  (requiere estar logueado)
export async function me(req, res) {
  res.json({ user: req.user });
}
