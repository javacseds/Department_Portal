import { Router } from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all achievements
router.get('/', AchievementController.getAll);

// Get single achievement
router.get('/:id', AchievementController.getById);

// Create achievement (Faculty, Students, Admins)
router.post(
  '/', 
  AchievementController.create
);

// Update achievement
router.put(
  '/:id', 
  AchievementController.update
);

// Delete achievement
router.delete(
  '/:id', 
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]), 
  AchievementController.delete
);

export default router;
