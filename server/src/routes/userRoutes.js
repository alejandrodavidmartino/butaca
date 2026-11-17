import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import { getAvatar, getProfile, generateTasteSummary } from '../controllers/profileController.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Foto de perfil: pública porque la pide una etiqueta <img> (que no envía el token)
router.get('/:id/avatar', getAvatar);

// Ratatús escribe tu perfil cinéfilo (usa la IA: con límite de uso)
router.post('/me/taste', protect, rateLimit({ max: 5, windowMs: 10 * 60 * 1000 }), generateTasteSummary);

// GET /api/users/search?q=lau  -> buscar amigos por @usuario o nombre
router.get('/search', protect, async (req, res) => {
  const q = String(req.query.q || '').trim().replace(/^@/, '');
  if (q.length < 2) return res.json([]);

  // Escapamos caracteres especiales para usar el texto dentro de una expresión regular
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const users = await User.find({
    _id: { $ne: req.user._id },
    active: true,
    $or: [{ username: new RegExp('^' + safe, 'i') }, { name: new RegExp(safe, 'i') }],
  })
    .select('name username avatarVersion')
    .limit(8)
    .lean();
  res.json(users);
});

// Perfil público de un usuario (requiere sesión)
router.get('/:username/profile', protect, getProfile);

export default router;
