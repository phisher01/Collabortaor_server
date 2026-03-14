import { Router } from 'express';
import { verifyBearer } from '../middleware/verifyBearer';
import * as taskController from '../controllers/taskController';

const router = Router();

router.use(verifyBearer);

router.get('/', taskController.list);
router.post('/', taskController.create);
router.patch('/:id', taskController.update);
router.delete('/:id', taskController.remove);

export default router;
