import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authenticate, requireRoles } from '../middlewares/auth';
import { uploadSingle, uploadMultiple } from '../middlewares/upload';
import { USER_ROLES } from '@cddas/shared';

const router = Router();

router.use(authenticate);

// Get all files
router.get('/', FileController.getAll);

// Get single file metadata
router.get('/:id', FileController.getById);

// Upload single file
router.post(
  '/upload',
  uploadSingle('file'),
  FileController.upload
);

// Upload multiple files
router.post(
  '/upload-multiple',
  uploadMultiple('files', 10),
  FileController.uploadMultiple
);

// Delete file
router.delete(
  '/:id',
  requireRoles([USER_ROLES.SUPER_ADMIN, USER_ROLES.DEPARTMENT_ADMIN, USER_ROLES.HOD]),
  FileController.delete
);

export default router;
