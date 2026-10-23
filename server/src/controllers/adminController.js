/**
 * server/src/controllers/adminController.js
 * Controller Quản Trị Hệ Thống Dành Riêng Cho Quyền ADMIN
 * 
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

const userModel = require('../models/userModel');
const { getDatabase } = require('../config/database');

const adminController = {
  /**
   * Lấy danh sách toàn bộ người dùng trong hệ thống
   */
  async listUsers(req, res) {
    try {
      const users = userModel.listAll();
      res.json({
        success: true,
        data: users,
        total: users.length
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message
        }
      });
    }
  },

  /**
   * Thay đổi vai trò người dùng (Admin <-> User)
   */
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['admin', 'user'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vai trò phải là "admin" hoặc "user"'
          }
        });
      }

      const updated = userModel.updateRole(id, role);
      res.json({
        success: true,
        message: `Đã cập nhật vai trò người dùng thành ${role}`,
        data: userModel.sanitizeUser(updated)
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: err.message
        }
      });
    }
  },

  /**
   * Xóa tài khoản người dùng
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const success = userModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy người dùng'
          }
        });
      }

      res.json({
        success: true,
        message: 'Đã xóa tài khoản người dùng thành công'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: err.message
        }
      });
    }
  },

  /**
   * Thống kê toàn cảnh hệ sinh thái người dùng & CSDL
   */
  async getSystemStats(req, res) {
    try {
      const db = getDatabase();
      const totalUsers = userModel.count();
      const totalTransactions = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;
      const totalWallets = db.prepare('SELECT COUNT(*) as c FROM wallets').get().c;
      const totalCategories = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
      const totalVolume = db.prepare('SELECT COALESCE(SUM(amount), 0) as s FROM transactions').get().s;

      res.json({
        success: true,
        data: {
          usersCount: totalUsers,
          transactionsCount: totalTransactions,
          walletsCount: totalWallets,
          categoriesCount: totalCategories,
          totalTransactionVolume: totalVolume,
          dbEngine: 'SQLite 3 (better-sqlite3)',
          journalMode: 'WAL (Write-Ahead Logging)',
          serverUptimeSeconds: process.uptime()
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: err.message
        }
      });
    }
  }
};

module.exports = adminController;
