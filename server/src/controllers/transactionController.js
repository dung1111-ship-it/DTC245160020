/**
 * src/controllers/transactionController.js
 * Xử lý các yêu cầu HTTP liên quan đến giao dịch thu / chi
 */

const transactionModel = require('../models/transactionModel');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const transactionController = {
  getTransactions: asyncHandler(async (req, res) => {
    const result = transactionModel.find(req.query);
    res.json({
      success: true,
      data: result.transactions,
      meta: result.pagination
    });
  }),

  getTransactionById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const transaction = transactionModel.getById(id);
    if (!transaction) {
      throw ApiError.notFound(`Không tìm thấy giao dịch với ID: ${id}`);
    }

    res.json({
      success: true,
      data: transaction
    });
  }),

  createTransaction: asyncHandler(async (req, res) => {
    const created = transactionModel.create(req.body);
    res.status(201).json({
      success: true,
      data: created,
      message: 'Tạo giao dịch thành công'
    });
  }),

  updateTransaction: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = transactionModel.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Không tìm thấy giao dịch với ID: ${id}`);
    }

    const updated = transactionModel.update(id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Cập nhật giao dịch thành công'
    });
  }),

  deleteTransaction: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = transactionModel.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Không tìm thấy giao dịch với ID: ${id}`);
    }

    transactionModel.delete(id);
    res.json({
      success: true,
      message: 'Đã xóa giao dịch thành công và hoàn trả số dư ví'
    });
  })
};

module.exports = transactionController;
