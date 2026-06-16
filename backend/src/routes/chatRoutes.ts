import { Router } from 'express';
import { handleChatMessage, getChatHistory } from '../controllers/chatController';
import { optionalProtect } from '../middleware/authMiddleware';

const router = Router();

router.post('/message', optionalProtect, handleChatMessage);
router.get('/history/:sessionId', getChatHistory);

export default router;
