import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

// Exige un token válido en la cabecera: Authorization: Bearer <token>
export async function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Necesitas iniciar sesión');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Sesión no válida o caducada');
  }

  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new HttpError(401, 'Usuario no disponible');

  req.user = user; // los controladores siguientes ya saben quién es
  next();
}

// Solo deja pasar a administradores (usar siempre después de protect)
export function adminOnly(req, _res, next) {
  if (req.user?.role !== 'admin') throw new HttpError(403, 'Solo para administradores');
  next();
}
