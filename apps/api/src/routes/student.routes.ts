import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all students
router.get('/', StudentController.getAll);

// Get single student
router.get('/:id', StudentController.getById);

// Create student
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD, USER_ROLES.OFFICE_STAFF, USER_ROLES.FACULTY]), 
  StudentController.create
);

// Update student
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD, USER_ROLES.OFFICE_STAFF, USER_ROLES.FACULTY]), 
  StudentController.update
);

// Delete student
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  StudentController.delete
);

export default router;
