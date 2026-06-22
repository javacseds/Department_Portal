import { Router } from 'express';
import { FormController } from '../controllers/form.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all forms
router.get('/', FormController.getAll);

// Get single form
router.get('/:id', FormController.getById);

// Create form (Admins and HODs)
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  FormController.create
);

// Update form
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  FormController.update
);

// Delete form
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  FormController.delete
);

export default router;
