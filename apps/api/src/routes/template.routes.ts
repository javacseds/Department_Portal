import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all templates
router.get('/', TemplateController.getAll);

// Get single template
router.get('/:id', TemplateController.getById);

// Generate document from template
router.post('/:id/generate', TemplateController.generate);

// Create template (Admins and HODs)
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  TemplateController.create
);

// Update template
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  TemplateController.update
);

// Delete template
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  TemplateController.delete
);

export default router;
