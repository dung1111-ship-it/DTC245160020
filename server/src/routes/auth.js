/**
 * server/src/routes/auth.js
 * Định tuyến các API xác thực Người Dùng (Đăng ký, Đăng nhập, Hồ sơ)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
