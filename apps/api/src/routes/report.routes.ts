import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);
router.use(requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]));

// Export NAAC/NBA formatted Excel reports
router.get('/export/achievements', ExportController.exportAchievements);
router.get('/export/events', ExportController.exportEvents);

export default router;
