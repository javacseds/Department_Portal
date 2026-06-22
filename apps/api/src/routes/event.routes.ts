import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all events
router.get('/', EventController.getAll);

// Get single event
router.get('/:id', EventController.getById);

// Create event
router.post(
  '/', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD, USER_ROLES.FACULTY, USER_ROLES.OFFICE_STAFF]), 
  EventController.create
);

// Update event
router.put(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD, USER_ROLES.FACULTY, USER_ROLES.OFFICE_STAFF]), 
  EventController.update
);

// Delete event
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  EventController.delete
);

export default router;
