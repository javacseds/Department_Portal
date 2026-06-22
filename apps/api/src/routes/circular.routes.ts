import { Router } from 'express';
import { CircularController } from '../controllers/circular.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all circulars (Filtered by user role internally)
router.get('/', CircularController.getAll);

// Get single circular
router.get('/:id', CircularController.getById);

// Create circular
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD, USER_ROLES.OFFICE_STAFF]), 
  CircularController.create
);

// Update circular
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD, USER_ROLES.OFFICE_STAFF]), 
  CircularController.update
);

// Delete circular
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  CircularController.delete
);

export default router;
