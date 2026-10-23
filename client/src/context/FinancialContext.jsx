/**
 * client/src/context/FinancialContext.jsx
 * Central State Management for Expense Tracker Application
 * 
 * Đề 38 - Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import api, { setNetworkStatusCallback } from '../services/api';

export const FinancialContext = createContext(null);

export function FinancialProvider({ children }) {
  // 1. Core Financial States
  const [currentMonth, setCurrentMonth] = useState('2026-10'); // Default test seed month
  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [budgets, setBudgets] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState({ items: [], summary: {} });

  // 2. Multi-criteria Filters for Transactions
  const [filters, setFilters] = useState({
    search: '',
    type: 'all', // 'all' | 'income' | 'expense'
    walletId: 'all', // 'all' | 'cash' | 'bank' | 'ewallet'
    categoryId: 'all',
    datePreset: 'this_month', // 'this_month' | 'prev_month' | 'last_3_months' | 'all' | 'custom'
    month: '2026-10',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  // 3. UI, System Health & Network Status
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState({ isOnline: true, checkedAt: new Date() });

  useEffect(() => {
    setNetworkStatusCallback((isOnline) => {
      setServerStatus(prev => ({ ...prev, isOnline, checkedAt: new Date() }));
    });
  }, []);

  /**
   * Health Check Probe
   */
  const checkHealth = useCallback(async () => {
    try {
      const health = await api.getHealth();
      setServerStatus({ isOnline: true, checkedAt: new Date(), data: health });
      return true;
    } catch {
      setServerStatus({ isOnline: false, checkedAt: new Date(), data: null });
      return false;
    }
  }, []);

  /**
   * Tải lại các chỉ số tài chính (Wallets, Summary, Categories, Budgets)
   */
  const refreshFinancials = useCallback(async (month = currentMonth) => {
    try {
      const [walletsData, summaryData, categoriesData, progressData] = await Promise.all([
        api.getWallets().catch(() => []),
        api.getSummary(month).catch(() => null),
        api.getCategories().catch(() => []),
        api.getBudgetProgress(month).catch(() => ({ items: [], summary: {} }))
      ]);

      const walletList = Array.isArray(walletsData) ? walletsData : [];
      setWallets(walletList);

      if (summaryData) {
        setSummary(summaryData);
      } else {
        // Fallback summary computation from wallets if backend summary fails
        const totalBal = walletList.reduce((sum, w) => sum + (Number(w.currentBalance) || 0), 0);
        setSummary({
          totalBalance: totalBal,
          monthlyIncome: 0,
          monthlyExpense: 0,
          netSavings: 0,
          savingsRate: 0,
          isDeficit: false,
          comparison: { previousMonth: '', incomeGrowthRate: 0, expenseGrowthRate: 0 }
        });
      }

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      if (progressData) setBudgetProgress(progressData);
      setServerStatus(prev => ({ ...prev, isOnline: true }));
      setError(null);
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu tài chính:', err);
      setServerStatus(prev => ({ ...prev, isOnline: false }));
      setError(err.message);
    }
  }, [currentMonth]);

  /**
   * Tải danh sách giao dịch theo bộ lọc
   */
  const fetchTransactions = useCallback(async (activeFilters = filters) => {
    try {
      // Map filters into query parameters expected by API
      const queryParams = {
        page: activeFilters.page || 1,
        limit: activeFilters.limit || 10,
        sortBy: activeFilters.sortBy || 'date',
        sortOrder: activeFilters.sortOrder || 'desc'
      };

      if (activeFilters.search && activeFilters.search.trim()) {
        queryParams.search = activeFilters.search.trim();
      }
      if (activeFilters.type && activeFilters.type !== 'all') {
        queryParams.type = activeFilters.type;
      }
      if (activeFilters.walletId && activeFilters.walletId !== 'all') {
        queryParams.walletId = activeFilters.walletId;
      }
      if (activeFilters.categoryId && activeFilters.categoryId !== 'all') {
        queryParams.categoryId = activeFilters.categoryId;
      }

      // Date Presets Mapping
      if (activeFilters.datePreset === 'this_month') {
        queryParams.month = activeFilters.month || currentMonth || '2026-10';
      } else if (activeFilters.datePreset === 'prev_month') {
        queryParams.month = '2026-09';
      } else if (activeFilters.datePreset === 'custom') {
        if (activeFilters.startDate) queryParams.startDate = activeFilters.startDate;
        if (activeFilters.endDate) queryParams.endDate = activeFilters.endDate;
      } else if (activeFilters.datePreset === 'all') {
        // No date constraint
      }

      const result = await api.getTransactions(queryParams);

      if (Array.isArray(result)) {
        setTransactions(result);
        const meta = result.meta || { total: result.length, page: queryParams.page, limit: queryParams.limit };
        setPagination({
          total: meta.total ?? result.length,
          page: meta.page ?? queryParams.page,
          limit: meta.limit ?? queryParams.limit,
          totalPages: Math.ceil((meta.total ?? result.length) / (meta.limit ?? queryParams.limit)) || 1
        });
      } else if (result && (result.transactions || result.data)) {
        const list = result.transactions || result.data || [];
        setTransactions(list);
        const meta = result.pagination || result.meta || { total: list.length, page: queryParams.page, limit: queryParams.limit };
        setPagination({
          total: meta.total ?? list.length,
          page: meta.page ?? queryParams.page,
          limit: meta.limit ?? queryParams.limit,
          totalPages: Math.ceil((meta.total ?? list.length) / (meta.limit ?? queryParams.limit)) || 1
        });
      }
    } catch (err) {
      console.warn('Lỗi khi tải giao dịch:', err);
    }
  }, [filters, currentMonth]);

  /**
   * Làm mới toàn bộ ứng dụng (khi khởi động hoặc sau thao tác CRUD)
   */
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      checkHealth(),
      refreshFinancials(currentMonth),
      fetchTransactions(filters)
    ]);
    setIsRefreshing(false);
    setIsLoading(false);
  }, [currentMonth, filters, checkHealth, refreshFinancials, fetchTransactions]);

  // Khởi động ứng dụng lần đầu
  useEffect(() => {
    refreshAll();
  }, [currentMonth]);

  // Lắng nghe thay đổi bộ lọc giao dịch
  useEffect(() => {
    fetchTransactions(filters);
  }, [filters, fetchTransactions]);

  /**
   * Chuyển đổi tháng khảo sát
   */
  const changeMonth = useCallback((newMonth) => {
    setCurrentMonth(newMonth);
    setFilters((prev) => ({ ...prev, month: newMonth, page: 1 }));
  }, []);

  /**
   * Cập nhật một trường trong bộ lọc giao dịch
   */
  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  /**
   * Đặt lại toàn bộ bộ lọc giao dịch về mặc định
   */
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      walletId: 'all',
      categoryId: 'all',
      datePreset: 'this_month',
      month: currentMonth,
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
  }, [currentMonth]);

  /**
   * Phân trang
   */
  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  /**
   * Thao tác CRUD Giao dịch (Tự động đồng bộ số dư)
   */
  const addTransaction = useCallback(async (data) => {
    const res = await api.createTransaction(data);
    await refreshAll();
    return res;
  }, [refreshAll]);

  const editTransaction = useCallback(async (id, data) => {
    const res = await api.updateTransaction(id, data);
    await refreshAll();
    return res;
  }, [refreshAll]);

  const removeTransaction = useCallback(async (id) => {
    const res = await api.deleteTransaction(id);
    await refreshAll();
    return res;
  }, [refreshAll]);

  /**
   * Thao tác CRUD Danh mục
   */
  const saveCategory = useCallback(async (data) => {
    let res;
    if (data.id) {
      res = await api.updateCategory(data.id, data);
    } else {
      res = await api.createCategory(data);
    }
    await refreshFinancials();
    return res;
  }, [refreshFinancials]);

  const deleteCategory = useCallback(async (id, transferToCategoryId) => {
    const res = await api.deleteCategory(id, transferToCategoryId);
    await refreshFinancials();
    await fetchTransactions(filters);
    return res;
  }, [refreshFinancials, fetchTransactions, filters]);

  /**
   * Thao tác CRUD Ngân sách (Budgets)
   */
  const saveBudget = useCallback(async (data) => {
    const payload = {
      categoryId: data.categoryId || data.category_id,
      month: data.month || currentMonth,
      limitAmount: Number(data.limitAmount || data.limit_amount || data.amount),
      warningThreshold: data.warningThreshold ? Number(data.warningThreshold) : 0.80
    };
    const res = await api.setBudget(payload);
    await refreshFinancials(currentMonth);
    return res;
  }, [currentMonth, refreshFinancials]);

  const removeBudget = useCallback(async (id) => {
    const res = await api.deleteBudget(id);
    await refreshFinancials(currentMonth);
    return res;
  }, [currentMonth, refreshFinancials]);

  const budgetAlertCount = useMemo(() => {
    if (!budgetProgress?.items) return 0;
    return budgetProgress.items.filter(b => b.status === 'warning' || b.status === 'exceeded').length;
  }, [budgetProgress]);

  // Context value memoization
  const value = useMemo(() => ({
    // Data states
    wallets,
    summary,
    categories,
    transactions,
    pagination,
    budgets,
    budgetProgress,
    budgetAlertCount,
    currentMonth,
    filters,

    // Status
    isLoading,
    isRefreshing,
    error,
    serverStatus,

    // Actions
    setCurrentMonth: changeMonth,
    setFilter,
    setFilters,
    resetFilters,
    setPage,
    setLimit,
    refreshAll,
    refreshFinancials,
    addTransaction,
    editTransaction,
    removeTransaction,
    saveCategory,
    deleteCategory,
    saveBudget,
    removeBudget
  }), [
    wallets,
    summary,
    categories,
    transactions,
    pagination,
    budgets,
    budgetProgress,
    budgetAlertCount,
    currentMonth,
    filters,
    isLoading,
    isRefreshing,
    error,
    serverStatus,
    changeMonth,
    setFilter,
    resetFilters,
    setPage,
    setLimit,
    refreshAll,
    refreshFinancials,
    addTransaction,
    editTransaction,
    removeTransaction,
    saveCategory,
    deleteCategory,
    saveBudget,
    removeBudget
  ]);

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

/**
 * Custom Hook useFinancialData
 */
export function useFinancialData() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialProvider');
  }
  return context;
}

export default FinancialContext;
