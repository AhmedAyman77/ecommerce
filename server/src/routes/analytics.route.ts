import { Router } from 'express';
import { getAnalyticsData, getDailySalesData } from '../controllers/analytics.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);
router.get('/', asyncHandler(getAnalyticsData));
router.get('/daily', asyncHandler(getDailySalesData));

export default router;