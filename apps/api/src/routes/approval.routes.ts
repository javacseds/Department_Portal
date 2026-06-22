import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Get all approvals (filtered by role/viewMode)
router.get('/', ApprovalController.getAll);

// Get single approval
router.get('/:id', ApprovalController.getById);

// Initiate approval request
router.post('/', ApprovalController.create);

// Process approval action (Approve/Reject)
router.post('/:id/action', ApprovalController.processAction);

// Delete approval (if needed)
router.delete('/:id', ApprovalController.delete);

export default router;
