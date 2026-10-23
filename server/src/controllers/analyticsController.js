/**
 * src/controllers/analyticsController.js
 * Xử lý các yêu cầu HTTP liên quan đến phân tích tài chính, biểu đồ và xuất báo cáo
 */

const transactionModel = require('../models/transactionModel');
const budgetModel = require('../models/budgetModel');
const { asyncHandler } = require('../middleware/errorHandler');

const analyticsController = {
  getSummary: asyncHandler(async (req, res) => {
    const { month } = req.query;
    const summary = transactionModel.getMonthlySummary(month);
    res.json({
      success: true,
      data: summary
    });
  }),

  getCategoryBreakdown: asyncHandler(async (req, res) => {
    const { month, type } = req.query;
    const breakdown = transactionModel.getCategoryBreakdown(month, type);
    res.json({
      success: true,
      data: breakdown
    });
  }),

  getTrends: asyncHandler(async (req, res) => {
    const { year, period } = req.query;
    let targetYear = '2026';
    if (year) {
      targetYear = String(year);
    } else if (typeof period === 'string' && period.length >= 4 && !isNaN(Number(period.slice(0, 4)))) {
      targetYear = period.slice(0, 4);
    }
    const trends = transactionModel.getCashFlowTrends(targetYear);
    res.json({
      success: true,
      data: trends
    });
  }),

  getTopExpenses: asyncHandler(async (req, res) => {
    const { month, limit } = req.query;
    const topExpenses = transactionModel.getTopExpenses(month, limit);
    res.json({
      success: true,
      data: topExpenses
    });
  }),

  getFinancialTips: asyncHandler(async (req, res) => {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const summary = transactionModel.getMonthlySummary(targetMonth);
    const budgetProgress = budgetModel.getProgress(targetMonth);

    const tips = [];

    // Phân tích chi tiêu ăn uống
    const foodBudget = budgetProgress.items.find(b => b.categoryId === 'cat_food');
    if (foodBudget && foodBudget.percentage >= 80) {
      tips.push({
        type: 'warning',
        category: 'Ăn uống',
        message: `Khoản chi ăn uống chiếm tỷ trọng khá lớn (${foodBudget.percentage}%). Hãy thử tự nấu ăn để gia tăng tiết kiệm.`,
        title: 'Cảnh báo chi tiêu Ăn uống',
        content: `Khoản chi ăn uống chiếm tỷ trọng khá lớn (${foodBudget.percentage}%). Hãy thử tự nấu ăn để gia tăng tiết kiệm.`
      });
    }

    // Phân tích tỷ lệ tiết kiệm
    if (summary.savingsRate >= 20) {
      tips.push({
        type: 'success',
        category: 'Tiết kiệm',
        message: `Tuyệt vời! Bạn đang duy trì tỷ lệ tích lũy tài chính lành mạnh (${summary.savingsRate}%).`,
        title: 'Tỷ lệ tiết kiệm xuất sắc! 🌟',
        content: `Bạn đã tiết kiệm được ${summary.savingsRate}% thu nhập trong tháng ${targetMonth}.`
      });
    } else if (summary.isDeficit) {
      tips.push({
        type: 'danger',
        category: 'Cân đối',
        message: 'Cảnh báo: Dòng tiền tháng này đang ở mức bội chi! Hãy rà soát lại các khoản chi tiêu không cấp thiết.',
        title: 'Cảnh báo thâm hụt tài chính ⚠️',
        content: 'Chi tiêu đang vượt quá thu nhập. Cần rà soát ngay các khoản chi tiêu.'
      });
    } else {
      tips.push({
        type: 'info',
        category: 'Tối ưu',
        message: 'Tận dụng các gói ưu đãi sinh viên để giảm thiểu chi phí phần mềm và dịch vụ đám mây.',
        title: 'Mẹo tối ưu sinh viên 💻',
        content: 'Tận dụng các gói ưu đãi sinh viên để giảm thiểu chi phí phần mềm và dịch vụ đám mây.'
      });
    }

    // Hỗ trợ cả Array response cho client.js và .tips property cho test_api.js
    tips.tips = tips;
    tips.month = targetMonth;

    res.json({
      success: true,
      data: tips
    });
  }),

  exportCsv: asyncHandler(async (req, res) => {
    const { month } = req.query;
    const { transactions } = transactionModel.find({ ...req.query, month, all: true });

    const headers = ["STT", "Ngày", "Loại", "Danh mục", "Số tiền (VNĐ)", "Ví", "Ghi chú"];
    const rows = [headers.join(",")];

    transactions.forEach((t, idx) => {
      const typeStr = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
      let walletName = t.walletName || 'Tiền mặt';
      if (t.walletId === 'cash') walletName = 'Tiền mặt';
      else if (t.walletId === 'bank') walletName = 'Thẻ ATM';
      else if (t.walletId === 'ewallet') walletName = 'Ví điện tử';

      const safeNote = `"${(t.note || "").replace(/"/g, '""')}"`;
      rows.push([
        idx + 1,
        t.date,
        typeStr,
        `"${t.categoryName || ''}"`,
        t.amount,
        `"${walletName}"`,
        safeNote
      ].join(","));
    });

    const csvContent = "\uFEFF" + rows.join("\r\n");

    // Nếu gọi qua client API hoặc Accept application/json, gửi dạng JSON string
    // để fetch().json() parse thành string \uFEFF...
    if (req.headers.accept && req.headers.accept.includes('text/csv')) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      return res.status(200).send(csvContent);
    }

    // Gửi dạng JSON (chuỗi có BOM) để fetch res.json() trả về string
    res.json(csvContent);
  })
};

module.exports = analyticsController;
