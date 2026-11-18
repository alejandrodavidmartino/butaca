import { Router } from 'express';
import { protect, requireVerified } from '../middleware/auth.js';
import * as g from '../controllers/groupController.js';

// Todas las rutas de grupos requieren haber iniciado sesión
const router = Router();

// La imagen se pide desde una etiqueta <img>, que no envía el token: va ANTES de protect
router.get('/:id/image', g.getImage);

router.use(protect);

router.get('/', g.myGroups);
router.post('/', requireVerified, g.createGroup);
router.post('/join', requireVerified, g.joinByCode);

router.get('/:id', g.getGroup);
router.patch('/:id', g.updateGroup);
router.delete('/:id', g.deleteGroup);

router.post('/:id/members', g.addMember);
router.delete('/:id/members/:userId', g.removeMember);

router.post('/:id/movies', g.addMovie);
router.patch('/:id/movies/:tmdbId', g.updateMovie);
router.delete('/:id/movies/:tmdbId', g.removeMovie);
router.put('/:id/movies/:tmdbId/rating', g.rateMovie);
router.delete('/:id/movies/:tmdbId/rating', g.unrateMovie);

router.get('/:id/random', g.randomMovie);
router.put('/:id/image', g.uploadImage);
router.delete('/:id/image', g.deleteImage);

export default router;
