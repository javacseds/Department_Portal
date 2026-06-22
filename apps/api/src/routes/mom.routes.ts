import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
const router = Router();
router.use(authenticate);
// TODO: Implement mom routes
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'mom module ready' }));
router.get('/:id', (req, res) => res.json({ success: true, data: null }));
router.post('/', (req, res) => res.json({ success: true, message: 'Created' }));
router.put('/:id', (req, res) => res.json({ success: true, message: 'Updated' }));
router.delete('/:id', (req, res) => res.json({ success: true, message: 'Deleted' }));
export default router;
