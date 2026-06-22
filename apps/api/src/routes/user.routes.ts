import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (Super Admin and Dept Admin can see lists)
router.get(
  '/',
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]),
  UserController.getAll
);

// Get single user
router.get('/:id', UserController.getById);

// Create user (Super Admin and Dept Admin)
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN]), 
  UserController.create
);

// Update user (Super Admin and Dept Admin)
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN]), 
  UserController.update
);

// Delete user (Super Admin only)
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN]), 
  UserController.delete
);

export default router;
