/**
 * src/routes/api.js
 * Router trung tâm của API v1, gắn kết tất cả các resource routers
 */

const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');
const analyticsController = require('../controllers/analyticsController');
const categoryRoutes = require('./categories');
const walletRoutes = require('./wallets');
const transactionRoutes = require('./transactions');
const budgetRoutes = require('./budgets');
const analyticsRoutes = require('./analytics');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');

const { getDatabase } = require('../config/database');
const { resetDatabase, seedDatabase } = require('../scripts/seed');

// 1. Health check & student branding route
router.get('/health', healthController.getHealth);

// 2. Resource sub-routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoryRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/analytics', analyticsRoutes);

// 3. Export CSV shortcut route
router.get('/export/csv', analyticsController.exportCsv);

// 4. System seed & reset helper routes
router.post('/system/seed', (req, res) => {
  const db = getDatabase();
  seedDatabase(db, true);
  res.json({ success: true, message: 'Seed data successfully populated' });
});

router.post('/seed', (req, res) => {
  const db = getDatabase();
  seedDatabase(db, true);
  res.json({ success: true, message: 'Seed data successfully populated' });
});

router.post('/system/reset', (req, res) => {
  const db = getDatabase();
  resetDatabase(db);
  res.json({ success: true, message: 'Reset complete' });
});

router.post('/reset', (req, res) => {
  const db = getDatabase();
  resetDatabase(db);
  res.json({ success: true, message: 'Reset complete' });
});

module.exports = router;
