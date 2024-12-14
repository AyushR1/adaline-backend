import { Router } from 'express';
import { getItem } from '../controllers/itemController';

const router = Router();

router.get('/', getItem);

export default router;
