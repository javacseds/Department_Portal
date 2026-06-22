import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

// All faculty routes require authentication
router.use(authenticate);

// Get all faculty (Anyone authenticated can see faculty lists)
router.get('/', FacultyController.getAll);

// Get single faculty
router.get('/:id', FacultyController.getById);

// Create faculty (Super Admin, Dept Admin, HOD)
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  FacultyController.create
);

// Update faculty
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  FacultyController.update
);

// Delete faculty
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN]), 
  FacultyController.delete
);

export default router;
