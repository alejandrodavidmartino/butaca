import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

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
    .select('name username avatar')
    .limit(8)
    .lean();
  res.json(users);
});

export default router;
