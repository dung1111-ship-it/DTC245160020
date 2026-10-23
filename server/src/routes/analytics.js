/**
 * src/routes/analytics.js
 * Định tuyến các báo cáo phân tích tài chính, biểu đồ Recharts và gợi ý thông minh
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/summary', analyticsController.getSummary);
router.get('/overview', analyticsController.getSummary);
router.get('/category-breakdown', analyticsController.getCategoryBreakdown);
router.get('/trends', analyticsController.getTrends);
router.get('/trend', analyticsController.getTrends);
router.get('/top-expenses', analyticsController.getTopExpenses);
router.get('/financial-tips', analyticsController.getFinancialTips);
router.get('/export/csv', analyticsController.exportCsv);

module.exports = router;
