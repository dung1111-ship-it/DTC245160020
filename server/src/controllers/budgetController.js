/**
 * src/controllers/budgetController.js
 * Xử lý các yêu cầu HTTP liên quan đến hạn mức ngân sách và cảnh báo chi tiêu
 */

const budgetModel = require('../models/budgetModel');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const budgetController = {
  getBudgets: asyncHandler(async (req, res) => {
    const { month } = req.query;
    const budgets = budgetModel.getAll(month);
    res.json({
      success: true,
      data: budgets
    });
  }),

  getBudgetProgress: asyncHandler(async (req, res) => {
    const { month } = req.query;
    const progressData = budgetModel.getProgress(month);
    res.json({
      success: true,
      data: progressData
    });
  }),

  getBudgetById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const budget = budgetModel.getById(id);
    if (!budget) {
      throw ApiError.notFound(`Không tìm thấy ngân sách với ID: ${id}`);
    }

    res.json({
      success: true,
      data: budget
    });
  }),

  setBudget: asyncHandler(async (req, res) => {
    const budget = budgetModel.upsert(req.body);
    res.status(200).json({
      success: true,
      data: budget,
      message: 'Thiết lập ngân sách thành công'
    });
  }),

  deleteBudget: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = budgetModel.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Không tìm thấy ngân sách với ID: ${id}`);
    }

    budgetModel.delete(id);
    res.json({
      success: true,
      message: 'Đã xóa ngân sách thành công'
    });
  }),

  getAlerts: asyncHandler(async (req, res) => {
    const { month } = req.query;
    const alerts = budgetModel.getAlerts(month);
    res.json({
      success: true,
      data: alerts
    });
  })
};

module.exports = budgetController;
