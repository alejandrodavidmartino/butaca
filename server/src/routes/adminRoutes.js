import { Router } from 'express';
import { listReviewsAdmin, moderateReview } from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import * as a from '../controllers/adminController.js';

// Back-Office: todas las rutas exigen sesión Y rol de administrador
const router = Router();
router.use(protect, adminOnly);

router.get('/stats', a.stats);

router.get('/users', a.listUsers);
router.patch('/users/:id', a.updateUser);
router.delete('/users/:id', a.deleteUser);

router.get('/categories', a.listCategories);
router.post('/categories', a.createCategory);
router.patch('/categories/:id', a.updateCategory);
router.delete('/categories/:id', a.deleteCategory);

router.get('/tags', a.listTags);
router.post('/tags', a.createTag);
router.patch('/tags/:id', a.updateTag);
router.delete('/tags/:id', a.deleteTag);

router.get('/collections', a.listCollections);
router.post('/collections', a.createCollection);
router.get('/collections/:id', a.getCollection);
router.patch('/collections/:id', a.updateCollection);
router.delete('/collections/:id', a.deleteCollection);

router.get('/groups', a.listGroups);
router.delete('/groups/:id', a.deleteGroupAdmin);
router.get('/reviews', listReviewsAdmin);
router.patch('/reviews/:id', moderateReview);
router.get('/comments', a.listComments);
router.delete('/comments/:groupId/:ratingId', a.deleteComment);

export default router;
