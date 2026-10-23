/**
 * src/models/transactionModel.js
 * Quản lý dữ liệu giao dịch thu / chi và các phép tính tổng hợp tài chính
 */

const { getDatabase } = require('../config/database');
const walletModel = require('./walletModel');

function formatTransaction(row) {
  if (!row) return null;
  const dateStr = row.transaction_date ? row.transaction_date.slice(0, 10) : '';

  return {
    id: row.id,
    date: dateStr,
    transaction_date: row.transaction_date,
    amount: Number(row.amount),
    type: row.type,
    walletId: row.wallet_id,
    wallet_id: row.wallet_id,
    categoryId: row.category_id,
    category_id: row.category_id,
    note: row.note !== undefined && row.note !== null ? String(row.note) : '',
    payee_payer: row.payee_payer || '',
    payeePayer: row.payee_payer || '',
    category_name: row.category_name || '',
    categoryName: row.category_name || '',
    category_icon: row.category_icon || '',
    categoryIcon: row.category_icon || '',
    category_color: row.category_color || '',
    categoryColor: row.category_color || '',
    wallet_name: row.wallet_name || '',
    walletName: row.wallet_name || '',
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
}

const transactionModel = {
  find(filters = {}) {
    const db = getDatabase();
    const {
      startDate,
      start_date,
      endDate,
      end_date,
      month,
      type,
      walletId,
      wallet_id,
      wallet,
      categoryId,
      category_id,
      search,
      page,
      limit,
      sortBy = 'transaction_date',
      sortOrder = 'DESC',
      all
    } = filters;

    const conditions = [];
    const params = [];

    const effectiveStartDate = startDate || start_date;
    const effectiveEndDate = endDate || end_date;
    const effectiveWalletId = walletId || wallet_id || wallet;
    const effectiveCategoryId = categoryId || category_id;

    if (effectiveStartDate) {
      conditions.push('t.transaction_date >= ?');
      params.push(effectiveStartDate);
    }
    if (effectiveEndDate) {
      conditions.push('t.transaction_date <= ?');
      params.push(effectiveEndDate.length === 10 ? `${effectiveEndDate}T23:59:59` : effectiveEndDate);
    }
    if (month) {
      conditions.push("strftime('%Y-%m', t.transaction_date) = ?");
      params.push(month);
    }
    if (type) {
      conditions.push('t.type = ?');
      params.push(type);
    }
    if (effectiveWalletId) {
      conditions.push('t.wallet_id = ?');
      params.push(effectiveWalletId);
    }
    if (effectiveCategoryId) {
      conditions.push('t.category_id = ?');
      params.push(effectiveCategoryId);
    }
    if (search && search.trim() !== '') {
      conditions.push('(t.note LIKE ? OR t.payee_payer LIKE ? OR c.name LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Đếm tổng số bản ghi
    const totalRow = db.prepare(`
      SELECT count(*) as count 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
    `).get(...params);
    const total = totalRow ? totalRow.count : 0;

    // Validate cột sắp xếp
    const allowedSort = ['transaction_date', 'date', 'amount', 'created_at'];
    let safeSortBy = 'transaction_date';
    if (sortBy === 'date') safeSortBy = 'transaction_date';
    else if (allowedSort.includes(sortBy)) safeSortBy = sortBy;

    const safeOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const isAll = all === true || all === 'true' || limit === 0 || limit === '0';
    const hasPagination = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = isAll ? Math.max(total, 1) : (hasPagination ? Math.max(1, parseInt(limit, 10) || 20) : 500);
    const offset = isAll || !hasPagination ? 0 : (pageNum - 1) * limitNum;

    const query = `
      SELECT 
        t.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        w.name AS wallet_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      ${whereClause}
      ORDER BY t.${safeSortBy} ${safeOrder}, t.id DESC
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(query).all(...params, limitNum, offset);

    return {
      transactions: rows.map(formatTransaction),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  },

  getById(id) {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT 
        t.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        w.name AS wallet_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.id = ?
    `).get(id);

    return formatTransaction(row);
  },

  create(data) {
    const db = getDatabase();
    const id = data.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const walletId = data.walletId || data.wallet_id || data.wallet;
    const categoryId = data.categoryId || data.category_id;
    const transactionDate = data.transaction_date || data.date || new Date().toISOString().slice(0, 10);
    const amount = Number(data.amount);
    const type = data.type;
    const note = (data.note !== undefined && data.note !== null ? String(data.note) : '').trim();
    const payeePayer = (data.payee_payer !== undefined ? data.payee_payer : (data.payeePayer !== undefined ? data.payeePayer : '')).trim();

    // Kiểm tra ràng buộc tồn tại của wallet và category
    const walletExists = db.prepare('SELECT 1 FROM wallets WHERE id = ?').get(walletId);
    if (!walletExists) {
      const err = new Error(`Ví tài khoản không tồn tại: ${walletId}`);
      err.code = 'VALIDATION_ERROR';
      err.statusCode = 400;
      throw err;
    }

    const categoryExists = db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId);
    if (!categoryExists) {
      const err = new Error(`Danh mục không tồn tại: ${categoryId}`);
      err.code = 'VALIDATION_ERROR';
      err.statusCode = 400;
      throw err;
    }

    const executeTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO transactions (id, wallet_id, category_id, type, amount, transaction_date, note, payee_payer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, walletId, categoryId, type, amount, transactionDate, note, payeePayer);

      walletModel.recalculateBalances();
    });

    executeTx();
    return this.getById(id);
  },

  update(id, data) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return null;

    const walletId = data.walletId || data.wallet_id || data.wallet || existing.walletId;
    const categoryId = data.categoryId || data.category_id || existing.categoryId;
    const transactionDate = data.transaction_date || data.date || existing.transaction_date;
    const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;
    const type = data.type || existing.type;
    const note = data.note !== undefined && data.note !== null ? String(data.note).trim() : existing.note;
    const payeePayer = data.payee_payer !== undefined ? String(data.payee_payer).trim() : (data.payeePayer !== undefined ? String(data.payeePayer).trim() : existing.payeePayer);

    // Kiểm tra ràng buộc
    if (walletId !== existing.walletId) {
      const walletExists = db.prepare('SELECT 1 FROM wallets WHERE id = ?').get(walletId);
      if (!walletExists) {
        const err = new Error(`Ví tài khoản không tồn tại: ${walletId}`);
        err.code = 'VALIDATION_ERROR';
        err.statusCode = 400;
        throw err;
      }
    }

    if (categoryId !== existing.categoryId) {
      const categoryExists = db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId);
      if (!categoryExists) {
        const err = new Error(`Danh mục không tồn tại: ${categoryId}`);
        err.code = 'VALIDATION_ERROR';
        err.statusCode = 400;
        throw err;
      }
    }

    const executeTx = db.transaction(() => {
      db.prepare(`
        UPDATE transactions
        SET wallet_id = ?,
            category_id = ?,
            type = ?,
            amount = ?,
            transaction_date = ?,
            note = ?,
            payee_payer = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(walletId, categoryId, type, amount, transactionDate, note, payeePayer, id);

      walletModel.recalculateBalances();
    });

    executeTx();
    return this.getById(id);
  },

  delete(id) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return false;

    const executeTx = db.transaction(() => {
      db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
      walletModel.recalculateBalances();
    });

    executeTx();
    return true;
  },

  // === CÁC PHÉP TÍNH PHÂN TÍCH TÀI CHÍNH ===

  getMonthlySummary(month) {
    const db = getDatabase();
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const row = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE strftime('%Y-%m', transaction_date) = ?
    `).get(targetMonth);

    const totalIncome = Number(row ? row.total_income : 0);
    const totalExpense = Number(row ? row.total_expense : 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 && netSavings > 0
      ? Number(((netSavings / totalIncome) * 100).toFixed(2))
      : 0;
    const isDeficit = totalExpense > totalIncome;

    // Tổng số dư khả dụng
    const wallets = walletModel.getAll();
    const totalBalance = wallets.reduce((sum, w) => sum + w.currentBalance, 0);

    // Tính toán tháng trước để so sánh MoM
    const [yearStr, mStr] = targetMonth.split('-');
    let prevYear = parseInt(yearStr, 10);
    let prevMonthNum = parseInt(mStr, 10) - 1;
    if (prevMonthNum === 0) {
      prevMonthNum = 12;
      prevYear -= 1;
    }
    const previousMonth = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;

    const prevRow = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
      FROM transactions
      WHERE strftime('%Y-%m', transaction_date) = ?
    `).get(previousMonth);

    const previousIncome = Number(prevRow ? prevRow.total_income : 0);
    const previousExpense = Number(prevRow ? prevRow.total_expense : 0);

    const incomeGrowthRate = previousIncome > 0
      ? Number((((totalIncome - previousIncome) / previousIncome) * 100).toFixed(2))
      : 0;
    const expenseGrowthRate = previousExpense > 0
      ? Number((((totalExpense - previousExpense) / previousExpense) * 100).toFixed(2))
      : 0;

    return {
      period: targetMonth,
      month: targetMonth,
      totalBalance,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      netSavings,
      savingsRate,
      isDeficit,
      transactionCount: Number(row ? row.transaction_count : 0),
      comparison: {
        previousMonth,
        previousIncome,
        previousExpense,
        incomeGrowthRate,
        expenseGrowthRate
      }
    };
  },

  getCategoryBreakdown(month, type = 'expense') {
    const db = getDatabase();
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const targetType = type || 'expense';

    const rows = db.prepare(`
      SELECT 
        c.id AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(t.amount), 0) AS total_amount,
        COUNT(t.id) AS transaction_count
      FROM categories c
      JOIN transactions t ON t.category_id = c.id
      WHERE strftime('%Y-%m', t.transaction_date) = ? AND t.type = ?
      GROUP BY c.id, c.name, c.icon, c.color
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `).all(targetMonth, targetType);

    const total = rows.reduce((sum, r) => sum + Number(r.total_amount), 0);

    const items = rows.map(r => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      icon: r.category_icon,
      color: r.category_color,
      amount: Number(r.total_amount),
      percentage: total > 0 ? Number(((Number(r.total_amount) / total) * 100).toFixed(2)) : 0,
      transactionCount: Number(r.transaction_count)
    }));

    return {
      month: targetMonth,
      type: targetType,
      totalAmount: total,
      items,
      categories: items
    };
  },

  getCashFlowTrends(year = '2026') {
    const db = getDatabase();
    const yearStr = String(year);

    const rows = db.prepare(`
      SELECT 
        strftime('%Y-%m', transaction_date) AS period,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE strftime('%Y', transaction_date) = ?
      GROUP BY period
      ORDER BY period ASC
    `).all(yearStr);

    return rows.map(r => {
      const inc = Number(r.income);
      const exp = Number(r.expense);
      const net = inc - exp;
      const rate = inc > 0 ? Number(((net / inc) * 100).toFixed(2)) : 0;
      const mPart = r.period.split('-')[1];

      return {
        month: r.period,
        period: r.period,
        label: `T${parseInt(mPart, 10)}/${yearStr}`,
        income: inc,
        expense: exp,
        net: net,
        netSavings: net,
        savingsRate: rate
      };
    });
  },

  getTopExpenses(month, limit = 5) {
    const db = getDatabase();
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    let query = `
      SELECT 
        t.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        w.name AS wallet_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.type = 'expense'
    `;
    const params = [];

    if (month) {
      query += ` AND strftime('%Y-%m', t.transaction_date) = ?`;
      params.push(month);
    }

    query += ` ORDER BY t.amount DESC LIMIT ?`;
    params.push(limitNum);

    const rows = db.prepare(query).all(...params);
    return rows.map(formatTransaction);
  }
};

module.exports = transactionModel;
