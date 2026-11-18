import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'node:crypto';
import { HttpError } from '../utils/httpError.js';
import { sendEmail, verificationEmail, appUrl } from '../services/email.js';

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
  const user = new User({ name, username, email, password });
  const verifyToken = user.createEmailVerifyToken();
  await user.save();

  // Si el correo falla (Brevo caído, clave mal...), la cuenta se crea igual: podrá pedir que se lo reenviemos
  const emailSent = await sendVerificationEmail(user, verifyToken);
  res.status(201).json({ token: signToken(user), user, emailSent });
}

// Envía el correo de confirmación. Devuelve true/false sin lanzar errores
async function sendVerificationEmail(user, token) {
  try {
    const link = `${appUrl()}/verificar?token=${token}`;
    await sendEmail({ to: user.email, toName: user.name, ...verificationEmail({ name: user.name, link }) });
    return true;
  } catch (err) {
    console.error('No se pudo enviar el correo de verificación:', err.message);
    return false;
  }
}

// POST /api/auth/verify-email  { token }  -> confirma el correo (no requiere sesión: se abre desde el email)
export async function verifyEmail(req, res) {
  const token = String(req.body.token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) throw new HttpError(400, 'El enlace de confirmación no es válido');

  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ emailVerifyTokenHash: hash }).select('+emailVerifyTokenHash +emailVerifyExpires');
  if (!user) throw new HttpError(400, 'El enlace no es válido o ya se ha usado');
  if (user.emailVerifyExpires < new Date()) {
    throw new HttpError(400, 'El enlace ha caducado. Inicia sesión y pide que te lo reenviemos', 'TOKEN_EXPIRED');
  }

  user.emailVerified = true;
  user.emailVerifyTokenHash = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();
  res.json({ message: '¡Correo confirmado! Ya puedes usar todo Butaca', user });
}

// POST /api/auth/resend-verification  (requiere sesión) -> reenvía el correo, como mucho 1 vez por minuto
export async function resendVerification(req, res) {
  const user = await User.findById(req.user._id);
  if (user.emailVerified) return res.json({ message: 'Tu correo ya está confirmado', user });

  const wait = user.emailVerifySentAt ? 60 - Math.floor((Date.now() - user.emailVerifySentAt) / 1000) : 0;
  if (wait > 0) throw new HttpError(429, `Espera ${wait} s antes de pedir otro correo`);

  const token = user.createEmailVerifyToken();
  await user.save();
  const sent = await sendVerificationEmail(user, token);
  if (!sent) throw new HttpError(502, 'No hemos podido enviar el correo ahora mismo. Inténtalo más tarde');
  res.json({ message: `Te hemos enviado un nuevo correo a ${user.email}`, user });
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
