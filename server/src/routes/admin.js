/**
 * server/src/routes/admin.js
 * Định tuyến các API Quản Trị Hệ Thống Dành Cho ADMIN
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Tất cả route admin đều yêu cầu Token và quyền role = 'admin'
router.use(authenticate, requireAdmin);

router.get('/users', adminController.listUsers);
router.put('/users/:id/role', adminController.updateRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/stats', adminController.getSystemStats);

module.exports = router;
