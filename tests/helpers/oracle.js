/**
 * Specification Reference Oracle for Expense Tracker (Đề 38)
 * Authoritative business logic, schema validation, calculations, and data contracts.
 * Student: Trần Mạnh Dũng (MSSV: DTC245160020)
 */

const crypto = require('node:crypto');

const EXAM_INFO = {
  studentName: "Trần Mạnh Dũng",
  studentId: "DTC245160020",
  className: "K23.K1.KHMT K23A",
  dateOfBirth: "30/07/2006",
  subject: "Triển khai và quản trị hệ thống phần mềm",
  topic: "Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính"
};

const DEFAULT_WALLETS = [
  { id: "cash", name: "Tiền mặt", icon: "Banknote", color: "#10B981", initialBalance: 2000000 },
  { id: "bank", name: "Tài khoản Ngân hàng (ATM)", icon: "CreditCard", color: "#3B82F6", initialBalance: 10000000 },
  { id: "ewallet", name: "Ví điện tử (Momo/ZaloPay)", icon: "Smartphone", color: "#EC4899", initialBalance: 1500000 }
];

const DEFAULT_CATEGORIES = [
  { id: "cat_salary", name: "Lương hàng tháng", type: "income", icon: "Briefcase", color: "#10B981", isDefault: true },
  { id: "cat_scholarship", name: "Học bổng", type: "income", icon: "Award", color: "#059669", isDefault: true },
  { id: "cat_freelance", name: "Thu nhập làm thêm", type: "income", icon: "Laptop", color: "#34D399", isDefault: true },
  { id: "cat_gift", name: "Thưởng & Quà tặng", type: "income", icon: "Gift", color: "#6EE7B7", isDefault: true },
  { id: "cat_income_other", name: "Thu nhập khác", type: "income", icon: "TrendingUp", color: "#A7F3D0", isDefault: true },

  { id: "cat_food", name: "Ăn uống & Nhà hàng", type: "expense", icon: "Utensils", color: "#EF4444", isDefault: true },
  { id: "cat_shopping", name: "Mua sắm", type: "expense", icon: "ShoppingBag", color: "#F97316", isDefault: true },
  { id: "cat_tuition", name: "Học phí & Giáo dục", type: "expense", icon: "GraduationCap", color: "#8B5CF6", isDefault: true },
  { id: "cat_housing", name: "Nhà ở & Điện nước", type: "expense", icon: "Home", color: "#6366F1", isDefault: true },
  { id: "cat_transport", name: "Di chuyển & Xăng xe", type: "expense", icon: "Car", color: "#EAB308", isDefault: true },
  { id: "cat_entertainment", name: "Giải trí & Giao lưu", type: "expense", icon: "Film", color: "#EC4899", isDefault: true },
  { id: "cat_health", name: "Y tế & Sức khỏe", type: "expense", icon: "HeartPulse", color: "#14B8A6", isDefault: true },
  { id: "cat_expense_other", name: "Chi tiêu khác", type: "expense", icon: "MoreHorizontal", color: "#9CA3AF", isDefault: true }
];

class ContractOracle {
  constructor() {
    this.reset();
  }

  reset() {
    this.wallets = JSON.parse(JSON.stringify(DEFAULT_WALLETS));
    this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    this.transactions = [];
    this.budgets = [];
  }

  seed() {
    this.reset();

    // 3 Months of realistic seed data for Trần Mạnh Dũng (Aug, Sep, Oct 2026)
    const seedTxns = [
      // August 2026
      { id: "txn_aug_01", date: "2026-08-01", amount: 4000000, type: "income", walletId: "bank", categoryId: "cat_freelance", note: "Lương làm thêm hè" },
      { id: "txn_aug_02", date: "2026-08-03", amount: 3000000, type: "income", walletId: "bank", categoryId: "cat_gift", note: "Gia đình hỗ trợ đầu năm học" },
      { id: "txn_aug_03", date: "2026-08-05", amount: 6500000, type: "expense", walletId: "bank", categoryId: "cat_tuition", note: "Đóng học phí Học kỳ 1 (Đề 38)" },
      { id: "txn_aug_04", date: "2026-08-08", amount: 450000, type: "expense", walletId: "cash", categoryId: "cat_tuition", note: "Sách giáo trình và văn phòng phẩm" },
      { id: "txn_aug_05", date: "2026-08-12", amount: 1800000, type: "expense", walletId: "cash", categoryId: "cat_food", note: "Tiền ăn cả tháng 8" },
      { id: "txn_aug_06", date: "2026-08-15", amount: 250000, type: "expense", walletId: "cash", categoryId: "cat_transport", note: "Xăng xe đi lại" },

      // September 2026
      { id: "txn_sep_01", date: "2026-09-01", amount: 5000000, type: "income", walletId: "bank", categoryId: "cat_freelance", note: "Dự án lập trình website" },
      { id: "txn_sep_02", date: "2026-09-05", amount: 2000000, type: "income", walletId: "bank", categoryId: "cat_scholarship", note: "Học bổng khuyến khích học tập" },
      { id: "txn_sep_03", date: "2026-09-06", amount: 2500000, type: "expense", walletId: "bank", categoryId: "cat_housing", note: "Tiền trọ và điện nước tháng 9" },
      { id: "txn_sep_04", date: "2026-09-10", amount: 2600000, type: "expense", walletId: "ewallet", categoryId: "cat_food", note: "Ăn uống và đi chợ nấu cơm" },
      { id: "txn_sep_05", date: "2026-09-18", amount: 400000, type: "expense", walletId: "ewallet", categoryId: "cat_shopping", note: "Mua phụ kiện bàn phím chuột" },
      { id: "txn_sep_06", date: "2026-09-25", amount: 350000, type: "expense", walletId: "cash", categoryId: "cat_entertainment", note: "Liên hoan nhóm bạn" },

      // October 2026 (Exam Defense Month)
      { id: "txn_oct_01", date: "2026-10-01", amount: 6000000, type: "income", walletId: "bank", categoryId: "cat_salary", note: "Lương thực tập doanh nghiệp" },
      { id: "txn_oct_02", date: "2026-10-05", amount: 1500000, type: "income", walletId: "bank", categoryId: "cat_gift", note: "Thưởng hoàn thành tiến độ dự án" },
      { id: "txn_oct_03", date: "2026-10-06", amount: 2500000, type: "expense", walletId: "bank", categoryId: "cat_housing", note: "Tiền trọ và internet tháng 10" },
      { id: "txn_oct_04", date: "2026-10-10", amount: 2800000, type: "expense", walletId: "cash", categoryId: "cat_food", note: "Ăn uống hàng ngày" },
      { id: "txn_oct_05", date: "2026-10-14", amount: 220000, type: "expense", walletId: "cash", categoryId: "cat_tuition", note: "In ấn báo cáo & đóng bìa Đề 38" },
      { id: "txn_oct_06", date: "2026-10-20", amount: 280000, type: "expense", walletId: "ewallet", categoryId: "cat_shopping", note: "Gia hạn dịch vụ cloud demo" }
    ];

    this.transactions = seedTxns.map(t => ({
      ...t,
      createdAt: `${t.date}T10:00:00.000Z`,
      updatedAt: `${t.date}T10:00:00.000Z`
    }));

    // Seed budgets for October 2026
    this.budgets = [
      { id: "bgt_oct_food", categoryId: "cat_food", month: "2026-10", limitAmount: 3000000, createdAt: "2026-10-01T00:00:00.000Z" },
      { id: "bgt_oct_housing", categoryId: "cat_housing", month: "2026-10", limitAmount: 2500000, createdAt: "2026-10-01T00:00:00.000Z" },
      { id: "bgt_oct_shopping", categoryId: "cat_shopping", month: "2026-10", limitAmount: 500000, createdAt: "2026-10-01T00:00:00.000Z" }
    ];

    return {
      message: "Seed data successfully populated",
      counts: {
        wallets: this.wallets.length,
        categories: this.categories.length,
        transactions: this.transactions.length,
        budgets: this.budgets.length
      }
    };
  }

  // --- Health & Exam Branding ---
  getHealth() {
    return {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      student: EXAM_INFO
    };
  }

  // --- Wallets ---
  getWallets() {
    return this.wallets.map(w => {
      const walletId = w.id;
      const txns = this.transactions.filter(t => (t.walletId || t.wallet) === walletId);
      const incomeSum = txns.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
      const expenseSum = txns.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
      const currentBalance = w.initialBalance + incomeSum - expenseSum;

      return {
        ...w,
        incomeSum,
        expenseSum,
        currentBalance
      };
    });
  }

  // --- Categories ---
  getCategories(type) {
    if (type) {
      return this.categories.filter(c => c.type === type);
    }
    return [...this.categories];
  }

  createCategory(data) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      throw new Error("Tên danh mục không được để trống");
    }
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      throw new Error("Loại danh mục phải là 'income' hoặc 'expense'");
    }
    const id = data.id || `cat_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const newCat = {
      id,
      name: data.name.trim(),
      type: data.type,
      icon: data.icon || (data.type === 'income' ? 'DollarSign' : 'Tag'),
      color: data.color || '#6B7280',
      isDefault: false
    };
    this.categories.push(newCat);
    return newCat;
  }

  updateCategory(id, data) {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Category ${id} not found`);
    }
    const existing = this.categories[idx];
    const updated = {
      ...existing,
      ...data,
      id: existing.id // preserve ID
    };
    this.categories[idx] = updated;
    return updated;
  }

  deleteCategory(id) {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Category ${id} not found`);
    }
    const hasTxns = this.transactions.some(t => t.categoryId === id);
    if (hasTxns) {
      throw new Error("Không thể xóa danh mục đang có giao dịch phát sinh. Vui lòng chuyển giao dịch sang danh mục khác trước khi xóa.");
    }
    this.categories.splice(idx, 1);
    return { success: true, message: "Xóa danh mục thành công" };
  }

  // --- Transactions ---
  getTransactions(query = {}) {
    let list = [...this.transactions];

    if (query.type) {
      list = list.filter(t => t.type === query.type);
    }
    if (query.walletId || query.wallet) {
      const w = query.walletId || query.wallet;
      list = list.filter(t => (t.walletId || t.wallet) === w);
    }
    if (query.categoryId) {
      list = list.filter(t => t.categoryId === query.categoryId);
    }
    if (query.startDate) {
      list = list.filter(t => t.date >= query.startDate);
    }
    if (query.endDate) {
      list = list.filter(t => t.date <= query.endDate);
    }
    if (query.month) {
      list = list.filter(t => t.date.startsWith(query.month));
    }
    if (query.search) {
      const s = query.search.toLowerCase().trim();
      list = list.filter(t => {
        const noteMatch = (t.note || "").toLowerCase().includes(s);
        const cat = this.categories.find(c => c.id === t.categoryId);
        const catMatch = cat && cat.name.toLowerCase().includes(s);
        return noteMatch || catMatch;
      });
    }

    // Default sorting: date desc, createdAt desc
    list.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));

    // Enrich with category details
    return list.map(t => {
      const cat = this.categories.find(c => c.id === t.categoryId) || {
        name: "Khác",
        icon: "HelpCircle",
        color: "#9CA3AF"
      };
      return {
        ...t,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color
      };
    });
  }

  getTransactionById(id) {
    const txn = this.transactions.find(t => t.id === id);
    if (!txn) {
      throw new Error(`Transaction ${id} not found`);
    }
    const cat = this.categories.find(c => c.id === txn.categoryId);
    return {
      ...txn,
      categoryName: cat?.name || "Khác",
      categoryIcon: cat?.icon || "HelpCircle",
      categoryColor: cat?.color || "#9CA3AF"
    };
  }

  createTransaction(data) {
    // Validation
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Số tiền giao dịch phải lớn hơn 0 VNĐ");
    }
    if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      throw new Error("Ngày giao dịch không hợp lệ, định dạng yêu cầu YYYY-MM-DD");
    }
    // Check valid date values (e.g. Feb 31 invalid)
    const dateObj = new Date(data.date + "T00:00:00Z");
    if (isNaN(dateObj.getTime()) || dateObj.toISOString().slice(0, 10) !== data.date) {
      throw new Error("Ngày giao dịch không tồn tại trong lịch thực tế");
    }
    if (!['income', 'expense'].includes(data.type)) {
      throw new Error("Loại giao dịch phải là 'income' hoặc 'expense'");
    }
    const walletId = data.walletId || data.wallet;
    if (!walletId || !['cash', 'bank', 'ewallet'].includes(walletId)) {
      throw new Error("Tài khoản/Ví không hợp lệ (hỗ trợ 'cash', 'bank', 'ewallet')");
    }
    const cat = this.categories.find(c => c.id === data.categoryId);
    if (!cat) {
      throw new Error(`Danh mục ${data.categoryId} không tồn tại`);
    }

    const id = data.id || `txn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newTxn = {
      id,
      date: data.date,
      amount,
      type: data.type,
      walletId,
      categoryId: data.categoryId,
      note: (data.note || "").toString().trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.transactions.push(newTxn);
    return this.getTransactionById(id);
  }

  updateTransaction(id, data) {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new Error(`Transaction ${id} not found`);
    }

    const existing = this.transactions[idx];
    let amount = existing.amount;
    if (data.amount !== undefined) {
      amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Số tiền giao dịch phải lớn hơn 0 VNĐ");
      }
    }

    let date = existing.date;
    if (data.date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        throw new Error("Định dạng ngày yêu cầu YYYY-MM-DD");
      }
      const d = new Date(data.date + "T00:00:00Z");
      if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== data.date) {
        throw new Error("Ngày giao dịch không tồn tại trong lịch thực tế");
      }
      date = data.date;
    }

    let walletId = existing.walletId;
    if (data.walletId || data.wallet) {
      walletId = data.walletId || data.wallet;
      if (!['cash', 'bank', 'ewallet'].includes(walletId)) {
        throw new Error("Ví không hợp lệ");
      }
    }

    let categoryId = existing.categoryId;
    if (data.categoryId) {
      const cat = this.categories.find(c => c.id === data.categoryId);
      if (!cat) throw new Error("Danh mục không tồn tại");
      categoryId = data.categoryId;
    }

    const updated = {
      ...existing,
      ...data,
      amount,
      date,
      walletId,
      categoryId,
      note: data.note !== undefined ? (data.note || "").toString().trim() : existing.note,
      updatedAt: new Date().toISOString()
    };

    this.transactions[idx] = updated;
    return this.getTransactionById(id);
  }

  deleteTransaction(id) {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new Error(`Transaction ${id} not found`);
    }
    this.transactions.splice(idx, 1);
    return { success: true, message: "Xóa giao dịch thành công" };
  }

  // --- Budgets ---
  getBudgets(month) {
    let list = [...this.budgets];
    if (month) {
      list = list.filter(b => b.month === month);
    }

    return list.map(b => {
      // calculate spentAmount in that month for that category
      const spent = this.transactions
        .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(b.month))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const limit = Number(b.limitAmount);
      const remainingAmount = limit - spent;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      let status = "safe";
      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      }

      const cat = this.categories.find(c => c.id === b.categoryId);

      return {
        ...b,
        limitAmount: limit,
        spentAmount: spent,
        remainingAmount,
        percentage: Number(percentage.toFixed(2)),
        status,
        categoryName: cat?.name || "Khác",
        categoryIcon: cat?.icon || "Tag",
        categoryColor: cat?.color || "#EF4444"
      };
    });
  }

  setBudget(data) {
    const limit = Number(data.limitAmount);
    if (isNaN(limit) || limit <= 0) {
      throw new Error("Hạn mức ngân sách phải lớn hơn 0 VNĐ");
    }
    if (!data.month || !/^\d{4}-\d{2}$/.test(data.month)) {
      throw new Error("Định dạng tháng phải là YYYY-MM");
    }
    const cat = this.categories.find(c => c.id === data.categoryId);
    if (!cat) {
      throw new Error("Danh mục không tồn tại");
    }
    if (cat.type !== 'expense') {
      throw new Error("Chỉ có thể thiết lập ngân sách cho danh mục chi tiêu (expense)");
    }

    const existingIdx = this.budgets.findIndex(b => b.categoryId === data.categoryId && b.month === data.month);
    if (existingIdx !== -1) {
      this.budgets[existingIdx].limitAmount = limit;
      this.budgets[existingIdx].updatedAt = new Date().toISOString();
      return this.getBudgets(data.month).find(b => b.id === this.budgets[existingIdx].id);
    }

    const id = data.id || `bgt_${data.month}_${data.categoryId}`;
    const newBgt = {
      id,
      categoryId: data.categoryId,
      month: data.month,
      limitAmount: limit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.budgets.push(newBgt);
    return this.getBudgets(data.month).find(b => b.id === id);
  }

  deleteBudget(id) {
    const idx = this.budgets.findIndex(b => b.id === id);
    if (idx === -1) {
      throw new Error(`Budget ${id} not found`);
    }
    this.budgets.splice(idx, 1);
    return { success: true, message: "Xóa ngân sách thành công" };
  }

  // --- Analytics ---
  getAnalyticsOverview(month) {
    // If month not specified, defaults to current month
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // Wallets current balance
    const wallets = this.getWallets();
    const totalBalance = wallets.reduce((acc, w) => acc + w.currentBalance, 0);

    // Month transactions
    const monthTxns = this.transactions.filter(t => t.date.startsWith(targetMonth));
    const monthlyIncome = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpense = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

    // Savings rate = (Income - Expense) / Income * 100%
    let savingsRate = 0;
    if (monthlyIncome > 0) {
      const net = monthlyIncome - monthlyExpense;
      savingsRate = net > 0 ? (net / monthlyIncome) * 100 : 0;
    }

    return {
      month: targetMonth,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      savingsRate: Number(savingsRate.toFixed(2)),
      isDeficit: monthlyExpense > monthlyIncome
    };
  }

  getCategoryBreakdown(month, type = 'expense') {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const txns = this.transactions.filter(t => t.date.startsWith(targetMonth) && t.type === type);
    const totalAmount = txns.reduce((sum, t) => sum + Number(t.amount), 0);

    const map = new Map();
    for (const t of txns) {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + Number(t.amount));
    }

    const result = [];
    for (const [catId, amount] of map.entries()) {
      const cat = this.categories.find(c => c.id === catId);
      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
      result.push({
        categoryId: catId,
        name: cat?.name || "Khác",
        color: cat?.color || "#9CA3AF",
        icon: cat?.icon || "Tag",
        amount,
        percentage: Number(percentage.toFixed(2))
      });
    }

    result.sort((a, b) => b.amount - a.amount);
    return {
      month: targetMonth,
      type,
      totalAmount,
      categories: result
    };
  }

  getTrend(period = 6) {
    // Generate distinct months present in transactions
    const monthsSet = new Set(this.transactions.map(t => t.date.slice(0, 7)));
    const sortedMonths = Array.from(monthsSet).sort();

    return sortedMonths.map(m => {
      const txns = this.transactions.filter(t => t.date.startsWith(m));
      const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      return {
        month: m,
        income,
        expense,
        net: income - expense
      };
    });
  }

  getTopExpenses(month, limit = 5) {
    let txns = this.transactions.filter(t => t.type === 'expense');
    if (month) {
      txns = txns.filter(t => t.date.startsWith(month));
    }
    txns.sort((a, b) => Number(b.amount) - Number(a.amount));
    return txns.slice(0, limit).map(t => this.getTransactionById(t.id));
  }

  getFinancialTips(month) {
    const breakdown = this.getCategoryBreakdown(month, 'expense');
    const overview = this.getAnalyticsOverview(month);
    const tips = [];

    // Food ratio tip
    const foodCat = breakdown.categories.find(c => c.categoryId === 'cat_food');
    if (foodCat && foodCat.percentage > 40) {
      tips.push({
        type: "warning",
        category: "Ăn uống",
        message: `Khoản chi ăn uống chiếm tỷ trọng khá lớn (${foodCat.percentage}%). Hãy thử tự nấu ăn để gia tăng tiết kiệm.`
      });
    }

    // Savings rate tip
    if (overview.savingsRate >= 25) {
      tips.push({
        type: "success",
        category: "Tiết kiệm",
        message: `Tuyệt vời! Bạn đang duy trì tỷ lệ tích lũy tài chính lành mạnh (${overview.savingsRate}%).`
      });
    } else if (overview.isDeficit) {
      tips.push({
        type: "danger",
        category: "Cân đối",
        message: "Cảnh báo: Dòng tiền tháng này đang ở mức bội chi! Hãy rà soát lại các khoản chi tiêu không cấp thiết."
      });
    }

    return tips;
  }

  // --- Export Helpers ---
  exportCsv(query = {}) {
    const txns = this.getTransactions(query);
    const headers = ["STT", "Ngày", "Loại", "Danh mục", "Số tiền (VNĐ)", "Ví", "Ghi chú"];
    const rows = [headers.join(",")];

    txns.forEach((t, idx) => {
      const typeStr = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
      const walletName = t.walletId === 'cash' ? 'Tiền mặt' : (t.walletId === 'bank' ? 'Thẻ ATM' : 'Ví điện tử');
      const safeNote = `"${(t.note || "").replace(/"/g, '""')}"`;
      rows.push([
        idx + 1,
        t.date,
        typeStr,
        `"${t.categoryName}"`,
        t.amount,
        `"${walletName}"`,
        safeNote
      ].join(","));
    });

    // Microsoft Excel UTF-8 BOM prefix
    return "\uFEFF" + rows.join("\r\n");
  }
}

module.exports = {
  ContractOracle,
  EXAM_INFO,
  DEFAULT_WALLETS,
  DEFAULT_CATEGORIES
};
