/**
 * src/middleware/validator.js
 * Middleware kiểm tra tính hợp lệ dữ liệu đầu vào (Input Validator)
 */

/**
 * Kiểm tra tính hợp lệ của chuỗi ngày theo lịch thực tế (hỗ trợ kiểm tra năm nhuận)
 * @param {string} dateStr 
 * @returns {boolean}
 */
function isValidCalendarDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;

  // Khớp chính xác định dạng YYYY-MM-DD hoặc ISO YYYY-MM-DDTHH:mm:ss...
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Kiểm tra lịch thực tế qua UTC Date
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year &&
         (d.getUTCMonth() + 1) === month &&
         d.getUTCDate() === day;
}

function validateCreateTransaction(req, res, next) {
  const { amount, type, walletId, wallet_id, categoryId, category_id, date, transaction_date } = req.body;
  const errors = [];

  const effectiveWalletId = walletId || wallet_id;
  const effectiveCategoryId = categoryId || category_id;
  const effectiveDate = date || transaction_date;

  if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', issue: 'Số tiền phải là số dương lớn hơn 0 (greater than 0)' });
  }

  if (!type || !['income', 'expense'].includes(type)) {
    errors.push({ field: 'type', issue: 'Loại giao dịch phải là income hoặc expense' });
  }

  if (!effectiveWalletId || typeof effectiveWalletId !== 'string' || effectiveWalletId.trim() === '') {
    errors.push({ field: 'walletId', issue: 'Mã ví thanh toán (walletId) là bắt buộc' });
  }

  if (!effectiveCategoryId || typeof effectiveCategoryId !== 'string' || effectiveCategoryId.trim() === '') {
    errors.push({ field: 'categoryId', issue: 'Mã danh mục (categoryId) là bắt buộc' });
  }

  if (effectiveDate) {
    if (!isValidCalendarDate(effectiveDate)) {
      errors.push({ field: 'date', issue: 'Định dạng ngày giao dịch không hợp lệ (yêu cầu chuẩn YYYY-MM-DD và ngày thực tế)' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.map(e => e.issue).join('; '),
        details: errors
      }
    });
  }

  next();
}

function validateCreateCategory(req, res, next) {
  const { name, type, icon, color } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', issue: 'Tên danh mục phải có độ dài từ 2 ký tự trở lên' });
  }

  if (!type || !['income', 'expense'].includes(type)) {
    errors.push({ field: 'type', issue: 'Loại danh mục phải là income hoặc expense' });
  }

  if (!icon || typeof icon !== 'string' || icon.trim() === '') {
    errors.push({ field: 'icon', issue: 'Biểu tượng (icon) danh mục là bắt buộc' });
  }

  if (!color || typeof color !== 'string' || color.trim() === '') {
    errors.push({ field: 'color', issue: 'Mã màu sắc (color) danh mục là bắt buộc' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.map(e => e.issue).join('; '),
        details: errors
      }
    });
  }

  next();
}

function validateSetBudget(req, res, next) {
  const { categoryId, category_id, month, year, limitAmount, limit_amount } = req.body;
  const errors = [];

  const effectiveCategoryId = categoryId || category_id;
  const effectiveLimit = limitAmount !== undefined ? limitAmount : limit_amount;

  if (!effectiveCategoryId) {
    errors.push({ field: 'categoryId', issue: 'Mã danh mục (categoryId) là bắt buộc' });
  }

  if (effectiveLimit === undefined || effectiveLimit === null || typeof effectiveLimit !== 'number' || isNaN(effectiveLimit) || effectiveLimit <= 0) {
    errors.push({ field: 'limitAmount', issue: 'Hạn mức ngân sách phải là số dương lớn hơn 0' });
  }

  if (month === undefined || month === null) {
    errors.push({ field: 'month', issue: 'Tháng ngân sách (month) là bắt buộc (ví dụ: "2026-10")' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.map(e => e.issue).join('; '),
        details: errors
      }
    });
  }

  next();
}

module.exports = {
  isValidCalendarDate,
  validateCreateTransaction,
  validateCreateCategory,
  validateSetBudget
};
