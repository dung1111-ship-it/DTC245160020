/**
 * src/models/budgetModel.js
 * Quản lý kế hoạch ngân sách và phân tích tiến độ, cảnh báo hạn mức
 */

const { getDatabase } = require('../config/database');

function formatBudgetProgress(row) {
  if (!row) return null;
  const limitAmount = Number(row.limit_amount);
  const spentAmount = Number(row.spent_amount);
  const remainingAmount = Number(row.remaining_amount);
  const spentPercentage = Number(row.spent_percentage);

  return {
    id: row.budget_id,
    budgetId: row.budget_id,
    categoryId: row.category_id,
    category_id: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    month: row.month,
    limitAmount: limitAmount,
    limit_amount: limitAmount,
    spentAmount: spentAmount,
    spent_amount: spentAmount,
    remainingAmount: remainingAmount,
    remaining_amount: remainingAmount,
    percentage: spentPercentage,
    spent_percentage: spentPercentage,
    warningThreshold: Number(row.warning_threshold),
    status: row.status // 'safe' | 'warning' | 'exceeded'
  };
}

const budgetModel = {
  getProgress(month) {
    const db = getDatabase();
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const rows = db.prepare(`
      SELECT * FROM v_budget_progress
      WHERE month = ?
      ORDER BY spent_percentage DESC
    `).all(targetMonth);

    const items = rows.map(formatBudgetProgress);

    const totalBudgetLimit = items.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalBudgetSpent = items.reduce((sum, b) => sum + b.spentAmount, 0);
    const remaining = totalBudgetLimit - totalBudgetSpent;
    const overallPercentage = totalBudgetLimit > 0
      ? Number(((totalBudgetSpent / totalBudgetLimit) * 100).toFixed(2))
      : 0;

    let overallStatus = 'safe';
    if (overallPercentage >= 100) overallStatus = 'exceeded';
    else if (overallPercentage >= 80) overallStatus = 'warning';

    const alertCounts = {
      safe: items.filter(b => b.status === 'safe').length,
      warning: items.filter(b => b.status === 'warning').length,
      exceeded: items.filter(b => b.status === 'exceeded').length
    };

    return {
      month: targetMonth,
      summary: {
        totalBudgetLimit,
        totalBudgetSpent,
        remaining,
        overallPercentage,
        overallStatus,
        alertCounts
      },
      items
    };
  },

  getAll(month) {
    const db = getDatabase();
    let query = 'SELECT * FROM v_budget_progress';
    const params = [];

    if (month) {
      query += ' WHERE month = ?';
      params.push(month);
    }

    query += ' ORDER BY spent_percentage DESC';
    const rows = db.prepare(query).all(...params);
    return rows.map(formatBudgetProgress);
  },

  getById(id) {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM v_budget_progress WHERE budget_id = ?').get(id);
    return formatBudgetProgress(row);
  },

  upsert({ categoryId, category_id, month, year, limitAmount, limit_amount, warningThreshold, warning_threshold, id: customId }) {
    const db = getDatabase();
    const catId = categoryId || category_id;
    const limit = Number(limitAmount !== undefined ? limitAmount : limit_amount);
    const threshold = Number(warningThreshold !== undefined ? warningThreshold : (warning_threshold !== undefined ? warning_threshold : 0.80));

    // Kiểm tra danh mục
    const cat = db.prepare('SELECT id, type FROM categories WHERE id = ?').get(catId);
    if (!cat) {
      const err = new Error(`Danh mục không tồn tại: ${catId}`);
      err.code = 'VALIDATION_ERROR';
      err.statusCode = 400;
      throw err;
    }

    if (cat.type !== 'expense') {
      const err = new Error('Chỉ có thể thiết lập ngân sách cho danh mục chi tiêu (expense)');
      err.code = 'VALIDATION_ERROR';
      err.statusCode = 400;
      throw err;
    }

    if (isNaN(limit) || limit <= 0) {
      const err = new Error('Hạn mức ngân sách phải là số dương lớn hơn 0');
      err.code = 'VALIDATION_ERROR';
      err.statusCode = 400;
      throw err;
    }

    // Chuẩn hóa định dạng month 'YYYY-MM'
    let normMonth = month;
    if (typeof month === 'number' && year) {
      normMonth = `${year}-${String(month).padStart(2, '0')}`;
    } else if (typeof month === 'string' && month.includes('-')) {
      normMonth = month.slice(0, 7);
    } else {
      normMonth = new Date().toISOString().slice(0, 7);
    }

    // Giữ nguyên ID nếu đã có
    const existing = db.prepare('SELECT id FROM budgets WHERE category_id = ? AND month = ?').get(catId, normMonth);
    const id = existing ? existing.id : (customId || `bgt_${normMonth}_${catId}`);

    db.prepare(`
      INSERT INTO budgets (id, category_id, month, limit_amount, warning_threshold)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(category_id, month) DO UPDATE SET
        limit_amount = excluded.limit_amount,
        warning_threshold = excluded.warning_threshold,
        updated_at = datetime('now', 'localtime')
    `).run(id, catId, normMonth, limit, threshold);

    return this.getById(id);
  },

  delete(id) {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getAlerts(month) {
    const db = getDatabase();
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const rows = db.prepare(`
      SELECT * FROM v_budget_progress 
      WHERE month = ? AND status IN ('warning', 'exceeded')
      ORDER BY spent_percentage DESC
    `).all(targetMonth);

    return rows.map(formatBudgetProgress);
  }
};

module.exports = budgetModel;
