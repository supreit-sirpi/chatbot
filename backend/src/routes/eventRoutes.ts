import { Router } from 'express';
import { getEvents, getEventById, registerForEvent } from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/:id/register', protect, registerForEvent);

export default router;
