import { Router } from 'express';
import { getAnalyticsData, getDailySalesData } from '../controllers/analytics.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requireAdmin, getAnalyticsData);
router.get('/daily', requireAuth, requireAdmin, getDailySalesData);

export default router;