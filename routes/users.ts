import { Router } from 'express';
import { verifyBearer } from '../middleware/verifyBearer';
import * as userController from '../controllers/userController';

const router = Router();

router.use(verifyBearer);
router.get('/', userController.list);

export default router;
