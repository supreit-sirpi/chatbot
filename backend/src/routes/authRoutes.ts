import { Router } from 'express';
import { requestOtp, verifyOtpCode, getUserProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/otp/send', requestOtp);
router.post('/otp/verify', verifyOtpCode);
router.get('/profile', protect, getUserProfile);

export default router;
