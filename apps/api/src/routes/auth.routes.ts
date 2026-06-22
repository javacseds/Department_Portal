import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next));

// Protected routes
router.use(authenticate);
router.get('/me', (req, res, next) => authController.getProfile(req as any, res, next));
router.post('/logout', (req, res, next) => authController.logout(req as any, res, next));
router.post('/logout-all', (req, res, next) => authController.logoutAll(req as any, res, next));
router.put('/change-password', (req, res, next) => authController.changePassword(req as any, res, next));

export default router;
