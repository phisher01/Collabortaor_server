import { Router } from 'express';
import authRoutes from './auth';
import taskRoutes from './tasks';
import * as healthController from '../controllers/healthController';

const router = Router();

router.get('/health', healthController.health);
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

export default router;
