import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Get my notifications
router.get('/', NotificationController.getMyNotifications);

// Mark all as read
router.post('/mark-all-read', NotificationController.markAllAsRead);

// Mark single notification as read
router.post('/:id/read', NotificationController.markAsRead);

export default router;
