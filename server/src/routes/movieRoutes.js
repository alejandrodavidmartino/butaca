import { Router } from 'express';
import { getList, search, discover, genres, detail, random, platforms } from '../controllers/movieController.js';

// Rutas públicas: cualquier visitante puede explorar el catálogo
const router = Router();

router.get('/list/:list', getList);
router.get('/search', search);
router.get('/discover', discover);
router.get('/genres', genres);
router.get('/random', random);
router.get('/platforms', platforms);
router.get('/:id', detail); // siempre la última, porque :id captura cualquier cosa

export default router;
