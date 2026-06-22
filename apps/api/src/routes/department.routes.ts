import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

// All department routes require authentication
router.use(authenticate);

// Get all departments (accessible by all authenticated users)
router.get('/', DepartmentController.getAll);

// Get single department
router.get('/:id', DepartmentController.getById);

// Create department (Super Admin only)
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN]), 
  DepartmentController.create
);

// Update department (Super Admin, Dept Admin, or HOD)
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  DepartmentController.update
);

// Delete department (Super Admin only)
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN]), 
  DepartmentController.delete
);

export default router;
