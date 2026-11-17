import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as g from '../controllers/groupController.js';

// Todas las rutas de grupos requieren haber iniciado sesión
const router = Router();
router.use(protect);

router.get('/', g.myGroups);
router.post('/', g.createGroup);
router.post('/join', g.joinByCode);

router.get('/:id', g.getGroup);
router.patch('/:id', g.updateGroup);
router.delete('/:id', g.deleteGroup);

router.post('/:id/members', g.addMember);
router.delete('/:id/members/:userId', g.removeMember);

router.post('/:id/movies', g.addMovie);
router.patch('/:id/movies/:tmdbId', g.updateMovie);
router.delete('/:id/movies/:tmdbId', g.removeMovie);

router.get('/:id/random', g.randomMovie);

export default router;
