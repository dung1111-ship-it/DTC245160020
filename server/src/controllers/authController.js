/**
 * server/src/controllers/authController.js
 * Controller Xử Lý Đăng Ký, Đăng Nhập & Hồ Sơ Người Dùng
 * 
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

const userModel = require('../models/userModel');
const { verifyPassword, generateToken } = require('../utils/authHelper');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authController = {
  /**
   * Đăng ký tài khoản mới công khai
   */
  async register(req, res) {
    try {
      const { username, email, password, fullName, studentId } = req.body;

      // 1. Kiểm tra đầu vào hợp lệ
      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tên đăng nhập (username) phải có tối thiểu 3 ký tự'
          }
        });
      }

      if (!email || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Địa chỉ email không đúng định dạng chuẩn'
          }
        });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Mật khẩu phải có tối thiểu 6 ký tự để đảm bảo an toàn'
          }
        });
      }

      // 2. Kiểm tra tài khoản đã tồn tại chưa
      const existingUser = userModel.findByUsername(username.trim());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.'
          }
        });
      }

      const existingEmail = userModel.findByEmail(email.trim());
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Địa chỉ email này đã được đăng ký trong hệ thống.'
          }
        });
      }

      // 3. Tạo tài khoản người dùng
      const newUser = userModel.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName ? fullName.trim() : username.trim(),
        studentId: studentId ? studentId.trim() : '',
        role: 'user'
      });

      const safeUser = userModel.sanitizeUser(newUser);
      const token = generateToken({
        id: safeUser.id,
        username: safeUser.username,
        role: safeUser.role
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: {
          user: safeUser,
          token
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTER_FAILED',
          message: err.message || 'Không thể đăng ký tài khoản'
        }
      });
    }
  },

  /**
   * Đăng nhập hệ thống
   */
  async login(req, res) {
    try {
      const usernameInput = req.body.username || req.body.identifier || req.body.email;
      const { password } = req.body;

      if (!usernameInput || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vui lòng nhập tên đăng nhập (hoặc email) và mật khẩu'
          }
        });
      }

      // Tìm user theo username hoặc email
      const user = userModel.findByUsernameOrEmail(usernameInput.trim());
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
          }
        });
      }

      // Kiểm tra mật khẩu
      const isValid = verifyPassword(password, user.salt, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
          }
        });
      }

      const safeUser = userModel.sanitizeUser(user);
      const token = generateToken({
        id: safeUser.id,
        username: safeUser.username,
        role: safeUser.role
      });

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: safeUser,
          token
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: err.message || 'Lỗi khi đăng nhập'
        }
      });
    }
  },

  /**
   * Lấy thông tin tài khoản hiện tại từ Token
   */
  async getMe(req, res) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Chưa đăng nhập'
        }
      });
    }

    res.json({
      success: true,
      data: req.user
    });
  }
};

module.exports = authController;
