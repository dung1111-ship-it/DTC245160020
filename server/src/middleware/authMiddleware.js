/**
 * server/src/middleware/authMiddleware.js
 * Middleware Xác Thực & Phân Quyền Vai Trò (Authentication & RBAC)
 * 
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

const { verifyToken } = require('../utils/authHelper');
const userModel = require('../models/userModel');

/**
 * Middleware giải mã Token (Nếu có đính kèm Bearer Token)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !payload.id) {
    req.user = null;
    return next();
  }

  try {
    const user = userModel.findById(payload.id);
    if (user) {
      req.user = userModel.sanitizeUser(user);
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }

  next();
}

/**
 * Middleware bắt buộc phải đăng nhập
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Yêu cầu đăng nhập để thực hiện chức năng này'
      }
    });
  }
  next();
}

/**
 * Middleware bắt buộc quyền Quản Trị Viên (Admin)
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Vui lòng đăng nhập với tài khoản Quản trị viên'
      }
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền Quản trị viên (Admin) để truy cập chức năng này'
      }
    });
  }

  next();
}

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin
};
