import { Router } from 'express';
import authRoutes from './auth.routes.js';
import podcastRoutes from './podcasts.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/podcasts', podcastRoutes);

export default router;