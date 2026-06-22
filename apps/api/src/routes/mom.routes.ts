import { Router } from 'express';
import { MomController } from '../controllers/mom.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all meetings
router.get('/', MomController.getAll);

// Get single meeting
router.get('/:id', MomController.getById);

// Create meeting (HOD, Dept Admin, Super Admin)
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  MomController.create
);

// Update meeting
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  MomController.update
);

// Delete meeting
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  MomController.delete
);

export default router;
