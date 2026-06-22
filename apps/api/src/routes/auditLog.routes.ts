import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

// Only Super Admins can view audit logs
router.use(authenticate);
router.use(requireRoles([USER_ROLES.SUPER_ADMIN]));

// Get all audit logs
router.get('/', AuditLogController.getAll);

export default router;
