import { Router } from 'express';
import { protect, requireVerified } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { sommelier, recommendForGroup } from '../controllers/aiController.js';

// La IA es contenido exclusivo para usuarios registrados, con límite de uso
const router = Router();
router.use(protect, requireVerified, rateLimit({ max: 20, windowMs: 10 * 60 * 1000 }));

router.post('/sommelier', sommelier);
router.post('/groups/:id/recommend', recommendForGroup);

export default router;
