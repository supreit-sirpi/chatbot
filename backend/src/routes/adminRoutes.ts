import { Router } from 'express';
import { getAdminUsers, getAdminAnalytics, exportUsersCsv, deleteUserByAdmin } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

// Secure all admin routes
router.use(protect);
router.use(admin);

router.get('/users', getAdminUsers);
router.delete('/users/:id', deleteUserByAdmin);
router.get('/analytics', getAdminAnalytics);
router.get('/export', exportUsersCsv);

export default router;
