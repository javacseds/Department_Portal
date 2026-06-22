import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { dashboardController } from '../controllers/dashboard.controller';
const router = Router();
router.use(authenticate);
router.get('/stats', (req, res, next) => dashboardController.getStats(req as any, res, next));
router.get('/calendar', (req, res, next) => dashboardController.getCalendarEvents(req as any, res, next));
export default router;
