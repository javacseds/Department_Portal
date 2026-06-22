import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

// Publicly available settings (e.g. College Name, Logo)
router.get('/public', SettingController.getPublicSettings);

// Authenticated routes
router.use(authenticate);

// Super admin only for full settings management
router.get('/', requireRoles([USER_ROLES.SUPER_ADMIN]), SettingController.getAll);
router.put('/', requireRoles([USER_ROLES.SUPER_ADMIN]), SettingController.updateSettings);

export default router;
