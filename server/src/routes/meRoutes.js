import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as w from '../controllers/watchedController.js';

// Zona personal del usuario: su diario de películas vistas
const router = Router();
router.use(protect);

router.get('/watched', w.listWatched);
router.get('/watched/stats', w.watchedStats); // antes que /:tmdbId
router.get('/watched/:tmdbId', w.getWatched);
router.put('/watched/:tmdbId', w.saveWatched);
router.delete('/watched/:tmdbId', w.deleteWatched);

export default router;
