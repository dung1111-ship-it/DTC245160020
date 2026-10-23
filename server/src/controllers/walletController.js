/**
 * src/controllers/walletController.js
 * Xử lý các yêu cầu HTTP liên quan đến ví và tài khoản thanh toán
 */

const walletModel = require('../models/walletModel');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const walletController = {
  getWallets: asyncHandler(async (req, res) => {
    const wallets = walletModel.getAll();
    const totalNetWorth = wallets.reduce((sum, w) => sum + w.currentBalance, 0);

    res.json({
      success: true,
      data: wallets,
      meta: {
        totalWallets: wallets.length,
        totalNetWorth
      }
    });
  }),

  getWalletById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const wallet = walletModel.getById(id);
    if (!wallet) {
      throw ApiError.notFound(`Không tìm thấy ví với ID: ${id}`);
    }

    res.json({
      success: true,
      data: wallet
    });
  }),

  createWallet: asyncHandler(async (req, res) => {
    const { name, type, initialBalance, initial_balance, accountNumber, account_number, icon, color, id } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw ApiError.badRequest('Tên ví là bắt buộc');
    }
    if (!type || !['cash', 'bank', 'ewallet', 'e_wallet'].includes(type)) {
      throw ApiError.badRequest('Loại ví phải thuộc: cash, bank, hoặc ewallet');
    }

    const created = walletModel.create({
      id,
      name,
      type,
      initialBalance,
      initial_balance,
      accountNumber,
      account_number,
      icon: icon || 'Banknote',
      color: color || '#10B981'
    });

    res.status(201).json({
      success: true,
      data: created,
      message: 'Tạo ví tài khoản thành công'
    });
  }),

  updateWallet: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = walletModel.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Không tìm thấy ví với ID: ${id}`);
    }

    const updated = walletModel.update(id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Cập nhật ví thành công'
    });
  }),

  deleteWallet: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = walletModel.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Không tìm thấy ví với ID: ${id}`);
    }

    walletModel.delete(id);
    res.json({
      success: true,
      message: 'Đã xóa ví thành công'
    });
  })
};

module.exports = walletController;
