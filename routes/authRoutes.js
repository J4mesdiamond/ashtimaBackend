// routes/authRoutes.js
import express from 'express';
const router = express.Router();
import { register, login, forgotPassword, verifyOTP, resetPassword, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

export { router as userAuthRoutes};