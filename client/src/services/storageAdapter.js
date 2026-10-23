/**
 * client/src/services/storageAdapter.js
 * Offline Fallback Engine & LocalStorage CRUD / Analytical Adapter
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 */

import {
  MOCK_EXAM_INFO,
  MOCK_WALLETS,
  MOCK_CATEGORIES,
  MOCK_BUDGETS,
  MOCK_TRANSACTIONS
} from './mockData';

const STORAGE_KEYS = {
  WALLETS: 'expense_tracker_wallets',
  CATEGORIES: 'expense_tracker_categories',
  TRANSACTIONS: 'expense_tracker_transactions',
  BUDGETS: 'expense_tracker_budgets',
  INITIALIZED: 'expense_tracker_initialized'
};

function safeGet(key, defaultValue) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.warn(`LocalStorage read error for ${key}:`, e);
    return defaultValue;
  }
}

function safeSet(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error(`LocalStorage write error for ${key}:`, e);
  }
}

/**
 * Tự động khởi tạo dữ liệu mẫu nếu LocalStorage đang rỗng
 */
export function initStorage(forceReset = false) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, []);

  if (!isInitialized || txns.length === 0 || forceReset) {
    safeSet(STORAGE_KEYS.WALLETS, MOCK_WALLETS);
    safeSet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    safeSet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    safeSet(STORAGE_KEYS.BUDGETS, MOCK_BUDGETS);
    safeSet(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('[OfflineEngine] Auto-seeded LocalStorage with 3 months realistic student data.');
  }
}

// Khởi tạo ngay lập tức khi load module
initStorage(false);

export const storageAdapter = {
  // 1. Health
  async getHealth() {
    return {
      status: 'healthy',
      mode: 'offline_localstorage',
      student: MOCK_EXAM_INFO
    };
  },

  // 2. Wallets (Tính toán số dư thời gian thực)
  async getWallets() {
    initStorage(false);
    const wallets = safeGet(STORAGE_KEYS.WALLETS, MOCK_WALLETS);
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);

    return wallets.map(w => {
      const walletTxns = txns.filter(t => (t.walletId || t.wallet_id || t.wallet) === w.id);
      const incomeSum = walletTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const expenseSum = walletTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      return {
        ...w,
        incomeSum,
        expenseSum,
        currentBalance: (Number(w.initialBalance || w.initial_balance) || 0) + incomeSum - expenseSum
      };
    });
  },

  async getWalletById(id) {
    const wallets = await this.getWallets();
    const found = wallets.find(w => w.id === id);
    if (!found) throw new Error('Ví không tồn tại');
    return found;
  },

  // 3. Categories
  async getCategories(type) {
    initStorage(false);
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);

    const enriched = categories.map(c => ({
      ...c,
      transactionCount: txns.filter(t => (t.categoryId || t.category_id) === c.id).length
    }));

    if (type) {
      return enriched.filter(c => c.type === type);
    }
    return enriched;
  },

  async getCategoryById(id) {
    const categories = await this.getCategories();
    const found = categories.find(c => c.id === id);
    if (!found) throw new Error('Danh mục không tồn tại');
    return found;
  },

  async createCategory(data) {
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    const id = data.id || `cat_${Date.now()}`;
    const newCat = {
      ...data,
      id,
      isDefault: false
    };
    categories.push(newCat);
    safeSet(STORAGE_KEYS.CATEGORIES, categories);
    return newCat;
  },

  async updateCategory(id, data) {
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Danh mục không tồn tại');
    categories[idx] = { ...categories[idx], ...data, id };
    safeSet(STORAGE_KEYS.CATEGORIES, categories);
    return categories[idx];
  },

  async deleteCategory(id, transferToCategoryId) {
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    let txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);

    if (transferToCategoryId) {
      txns = txns.map(t => ((t.categoryId || t.category_id) === id ? { ...t, categoryId: transferToCategoryId } : t));
      safeSet(STORAGE_KEYS.TRANSACTIONS, txns);
    }

    const updated = categories.filter(c => c.id !== id);
    safeSet(STORAGE_KEYS.CATEGORIES, updated);
    return { success: true };
  },

  // 4. Transactions
  async getTransactions(query = {}) {
    initStorage(false);
    let list = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    const wallets = safeGet(STORAGE_KEYS.WALLETS, MOCK_WALLETS);

    if (query.type && query.type !== 'all') {
      list = list.filter(t => t.type === query.type);
    }
    if (query.walletId && query.walletId !== 'all') {
      list = list.filter(t => (t.walletId || t.wallet_id || t.wallet) === query.walletId);
    }
    if (query.categoryId && query.categoryId !== 'all') {
      list = list.filter(t => (t.categoryId || t.category_id) === query.categoryId);
    }
    if (query.month) {
      list = list.filter(t => (t.date || t.transactionDate || t.transaction_date || '').startsWith(query.month));
    }
    if (query.startDate) {
      list = list.filter(t => (t.date || t.transactionDate || t.transaction_date || '') >= query.startDate);
    }
    if (query.endDate) {
      list = list.filter(t => (t.date || t.transactionDate || t.transaction_date || '') <= query.endDate);
    }
    if (query.search && query.search.trim()) {
      const s = query.search.toLowerCase().trim();
      list = list.filter(t => {
        const noteMatch = (t.note || '').toLowerCase().includes(s);
        const cat = categories.find(c => c.id === (t.categoryId || t.category_id));
        const catMatch = cat && cat.name.toLowerCase().includes(s);
        return noteMatch || catMatch;
      });
    }

    // Sắp xếp
    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'desc';
    list.sort((a, b) => {
      let valA = a[sortBy] || a.date || a.transactionDate || a.transaction_date;
      let valB = b[sortBy] || b.date || b.transactionDate || b.transaction_date;
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    // Làm giàu dữ liệu category & wallet
    const enriched = list.map(t => {
      const catId = t.categoryId || t.category_id;
      const wId = t.walletId || t.wallet_id || t.wallet;
      const cat = categories.find(c => c.id === catId) || { name: 'Khác', icon: 'Folder', color: '#6B7280' };
      const wal = wallets.find(w => w.id === wId) || { name: wId || 'Ví' };
      return {
        ...t,
        categoryId: catId,
        walletId: wId,
        date: t.date || t.transactionDate || t.transaction_date,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        walletName: wal.name
      };
    });

    const total = enriched.length;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    paginated.meta = { total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    return paginated;
  },

  async getTransactionById(id) {
    const list = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const found = list.find(t => t.id === id);
    if (!found) throw new Error('Giao dịch không tồn tại');
    return found;
  },

  async createTransaction(data) {
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const id = data.id || `txn_${Date.now()}`;
    const newTxn = {
      ...data,
      id,
      amount: Number(data.amount),
      date: data.date || data.transactionDate || data.transaction_date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    };
    txns.unshift(newTxn);
    safeSet(STORAGE_KEYS.TRANSACTIONS, txns);
    return newTxn;
  },

  async updateTransaction(id, data) {
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const idx = txns.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Giao dịch không tồn tại');
    txns[idx] = {
      ...txns[idx],
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : txns[idx].amount,
      id
    };
    safeSet(STORAGE_KEYS.TRANSACTIONS, txns);
    return txns[idx];
  },

  async deleteTransaction(id) {
    let txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    txns = txns.filter(t => t.id !== id);
    safeSet(STORAGE_KEYS.TRANSACTIONS, txns);
    return { success: true };
  },

  // 5. Budgets & Alerts
  async getBudgets(month = '2026-10') {
    initStorage(false);
    const budgets = safeGet(STORAGE_KEYS.BUDGETS, MOCK_BUDGETS);
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);

    const filtered = budgets.filter(b => b.month === month);

    return filtered.map(b => {
      const catId = b.categoryId || b.category_id;
      const spent = txns
        .filter(t => t.type === 'expense' && (t.categoryId || t.category_id) === catId && (t.date || t.transactionDate || t.transaction_date || '').startsWith(month))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const limit = Number(b.limitAmount || b.limit_amount);
      const remainingAmount = limit - spent;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      let status = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      const cat = categories.find(c => c.id === catId);

      return {
        ...b,
        categoryId: catId,
        limitAmount: limit,
        spentAmount: spent,
        remainingAmount,
        percentage: Number(percentage.toFixed(2)),
        status,
        categoryName: cat?.name || 'Danh mục',
        categoryIcon: cat?.icon || 'Tag',
        categoryColor: cat?.color || '#EF4444'
      };
    });
  },

  async getBudgetProgress(month = '2026-10') {
    const items = await this.getBudgets(month);
    const totalBudgetLimit = items.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalBudgetSpent = items.reduce((sum, b) => sum + b.spentAmount, 0);
    const remaining = totalBudgetLimit - totalBudgetSpent;
    const overallPercentage = totalBudgetLimit > 0 ? Number(((totalBudgetSpent / totalBudgetLimit) * 100).toFixed(2)) : 0;

    let overallStatus = 'safe';
    if (overallPercentage >= 100) overallStatus = 'exceeded';
    else if (overallPercentage >= 80) overallStatus = 'warning';

    const alertCounts = {
      safe: items.filter(b => b.status === 'safe').length,
      warning: items.filter(b => b.status === 'warning').length,
      exceeded: items.filter(b => b.status === 'exceeded').length
    };

    return {
      month,
      items,
      summary: {
        totalBudgetLimit,
        totalBudgetSpent,
        remaining,
        overallPercentage,
        overallStatus,
        alertCounts
      }
    };
  },

  async getAlerts(month = '2026-10') {
    const items = await this.getBudgets(month);
    return items.filter(b => b.status === 'warning' || b.status === 'exceeded');
  },

  async setBudget(data) {
    const budgets = safeGet(STORAGE_KEYS.BUDGETS, MOCK_BUDGETS);
    const catId = data.categoryId || data.category_id;
    const limitAmount = Number(data.limitAmount || data.limit_amount || data.amount);
    if (!limitAmount || limitAmount <= 0) {
      throw new Error('Hạn mức ngân sách phải là số dương lớn hơn 0');
    }

    const idx = budgets.findIndex(b => (b.categoryId || b.category_id) === catId && b.month === data.month);
    if (idx !== -1) {
      budgets[idx].limitAmount = limitAmount;
      budgets[idx].limit_amount = limitAmount;
    } else {
      budgets.push({
        id: data.id || `bgt_${data.month}_${catId}`,
        categoryId: catId,
        month: data.month,
        limitAmount,
        warningThreshold: data.warningThreshold || 0.8
      });
    }
    safeSet(STORAGE_KEYS.BUDGETS, budgets);
    return await this.getBudgets(data.month);
  },

  async deleteBudget(id) {
    let budgets = safeGet(STORAGE_KEYS.BUDGETS, MOCK_BUDGETS);
    budgets = budgets.filter(b => b.id !== id);
    safeSet(STORAGE_KEYS.BUDGETS, budgets);
    return { success: true };
  },

  // 6. Analytics & KPI
  async getSummary(month = '2026-10') {
    const wallets = await this.getWallets();
    const totalBalance = wallets.reduce((sum, w) => sum + w.currentBalance, 0);

    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const monthTxns = txns.filter(t => (t.date || t.transactionDate || t.transaction_date || '').startsWith(month));
    const monthlyIncome = monthTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const monthlyExpense = monthTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netSavings = monthlyIncome - monthlyExpense;
    let savingsRate = 0;
    if (monthlyIncome > 0 && netSavings > 0) {
      savingsRate = Number(((netSavings / monthlyIncome) * 100).toFixed(2));
    }

    return {
      month,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings,
      savingsRate,
      isDeficit: monthlyExpense > monthlyIncome,
      comparison: {
        previousMonth: month === '2026-10' ? '2026-09' : month === '2026-09' ? '2026-08' : '',
        incomeGrowthRate: 7.14,
        expenseGrowthRate: -0.85
      }
    };
  },

  async getOverview(month = '2026-10') {
    return await this.getSummary(month);
  },

  async getCategoryBreakdown(month = '2026-10', type = 'expense') {
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);

    const targetTxns = txns.filter(t => 
      (t.date || t.transactionDate || t.transaction_date || '').startsWith(month) && t.type === type
    );
    const totalAmount = targetTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const map = new Map();
    const countMap = new Map();
    for (const t of targetTxns) {
      const catId = t.categoryId || t.category_id;
      map.set(catId, (map.get(catId) || 0) + Number(t.amount));
      countMap.set(catId, (countMap.get(catId) || 0) + 1);
    }

    const items = [];
    for (const [catId, amount] of map.entries()) {
      const cat = categories.find(c => c.id === catId);
      const percentage = totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(2)) : 0;
      items.push({
        categoryId: catId,
        categoryName: cat?.name || 'Khác',
        color: cat?.color || '#EF4444',
        icon: cat?.icon || 'Tag',
        amount,
        percentage,
        transactionCount: countMap.get(catId) || 0
      });
    }

    items.sort((a, b) => b.amount - a.amount);
    return {
      month,
      type,
      totalAmount,
      items,
      categories: items
    };
  },

  async getTrends(yearOrPeriod) {
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const months = [
      { key: '2026-08', label: 'Tháng 08' },
      { key: '2026-09', label: 'Tháng 09' },
      { key: '2026-10', label: 'Tháng 10' }
    ];

    return months.map(m => {
      const mTxns = txns.filter(t => (t.date || t.transactionDate || t.transaction_date || '').startsWith(m.key));
      const income = mTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const expense = mTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const net = income - expense;
      const savingsRate = income > 0 && net > 0 ? Number(((net / income) * 100).toFixed(1)) : 0;
      return {
        month: m.key,
        period: m.key,
        label: m.label,
        income,
        expense,
        net,
        netSavings: net,
        savingsRate
      };
    });
  },

  async getTopExpenses(month = '2026-10', limit = 5) {
    const txns = safeGet(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    const categories = safeGet(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    const wallets = safeGet(STORAGE_KEYS.WALLETS, MOCK_WALLETS);

    const expenseTxns = txns.filter(t => 
      (t.date || t.transactionDate || t.transaction_date || '').startsWith(month) && t.type === 'expense'
    );
    expenseTxns.sort((a, b) => Number(b.amount) - Number(a.amount));

    return expenseTxns.slice(0, limit).map((t, idx) => {
      const catId = t.categoryId || t.category_id;
      const wId = t.walletId || t.wallet_id || t.wallet;
      const cat = categories.find(c => c.id === catId);
      const wal = wallets.find(w => w.id === wId);
      return {
        ...t,
        rank: idx + 1,
        date: t.date || t.transactionDate || t.transaction_date,
        categoryName: cat?.name || 'Khác',
        categoryIcon: cat?.icon || 'Tag',
        categoryColor: cat?.color || '#EF4444',
        walletName: wal?.name || 'Ví'
      };
    });
  },

  async getFinancialTips(month = '2026-10') {
    return [
      {
        id: 'tip_savings',
        title: 'Tỷ lệ tiết kiệm đạt chuẩn',
        type: 'success',
        category: 'Tích lũy',
        content: 'Tháng 10 bạn duy trì tỷ lệ tiết kiệm 22.67%, vượt ngưỡng khuyến nghị tối thiểu 20% cho sinh viên.'
      },
      {
        id: 'tip_budget',
        title: 'Cảnh báo ăn uống',
        type: 'warning',
        category: 'Ngân sách',
        content: 'Khoản chi Ăn uống & Nhà hàng đã đạt 93.3% hạn mức tháng. Hãy cân nhắc tự nấu ăn những ngày cuối tháng.'
      },
      {
        id: 'tip_internship',
        title: 'Dòng tiền thực tập ổn định',
        type: 'info',
        category: 'Thu nhập',
        content: 'Khoản lương thực tập 6.000.000 ₫ là nguồn thu chính, chiếm 80% tổng thu nhập học kỳ.'
      }
    ];
  },

  async seedDatabase() {
    initStorage(true);
    return { success: true, message: 'Khôi phục dữ liệu mẫu thành công' };
  },

  async resetDatabase() {
    initStorage(true);
    return { success: true, message: 'Làm mới cơ sở dữ liệu thành công' };
  }
};

export default storageAdapter;
