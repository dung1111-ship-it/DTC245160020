/**
 * client/src/App.jsx
 * Master Application Shell & Seamless Multi-Tab Integration (Milestone 3)
 * 
 * Đề tài: Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên thực hiện: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 * Giảng viên hướng dẫn: Bộ môn Triển khai và quản trị hệ thống phần mềm
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancialProvider, useFinancialData } from './context/FinancialContext';

// Layout & Branding Components
import Header from './components/layout/Header';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ExamModal from './components/layout/ExamModal';
import AuthModal from './components/auth/AuthModal';

// Dashboard & Core Cards
import KPICards from './components/dashboard/KPICards';
import WalletCards from './components/dashboard/WalletCards';

// Analytics Module (Milestone 3 - F16, F17, F18)
import {
  CategoryDoughnutChart,
  CashFlowTrendChart,
  TopExpenses,
  FinancialTips
} from './components/analytics';

// Transactions Module (F13, F14)
import FilterBar from './components/transactions/FilterBar';
import TransactionTable from './components/transactions/TransactionTable';
import TransactionModal from './components/transactions/TransactionModal';

// Categories Module (F15)
import CategoryManagerModal from './components/categories/CategoryManagerModal';
import { CategoryIcon } from './utils/iconResolver';

// Budgets Module (Milestone 3 - F19, F20)
import BudgetsView from './components/budgets/BudgetsView';
import AlertBanner from './components/budgets/AlertBanner';

// Reports & Export Module (F22, F23)
import ReportsView from './components/reports/ReportsView';

// Year 4 Capstone Modules: System Admin & Live API Console, Financial Health & Multi-wallet Transfer
import SystemAdminView from './components/system/SystemAdminView';
import AdminUserManagementView from './components/admin/AdminUserManagementView';
import FinancialHealthCard from './components/dashboard/FinancialHealthCard';
import TransferModal from './components/dashboard/TransferModal';

// Icons
import {
  Plus,
  Receipt,
  Tags,
  PiggyBank,
  BarChart3,
  ArrowRight,
  ArrowRightLeft
} from 'lucide-react';

/**
 * -----------------------------------------------------------------------------
 * 1. TAB: DASHBOARD VIEW (Tích hợp đầy đủ KPI, Wallets, Recharts Analytics, Tips)
 * -----------------------------------------------------------------------------
 */
function DashboardView({
  onOpenAddModal,
  onOpenTransferModal,
  onOpenCategoryModal,
  onSelectWallet,
  onNavigateTab
}) {
  const {
    summary,
    currentMonth,
    wallets,
    transactions,
    budgetProgress,
    isLoading,
    removeTransaction
  } = useFinancialData();

  // Lấy 5 giao dịch gần đây nhất
  const recentTransactions = useMemo(() => {
    return (transactions || []).slice(0, 5);
  }, [transactions]);

  // Đếm số lượng cảnh báo ngân sách
  const alertItems = useMemo(() => {
    const items = budgetProgress?.items || [];
    return items.filter(b => b.status === 'warning' || b.status === 'exceeded');
  }, [budgetProgress]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tổng quan Tài chính Cá nhân
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dữ liệu thực tế học kỳ 1 (Tháng 08 - Tháng 10/2026) • Sinh viên: <strong className="text-indigo-600 dark:text-indigo-400">Trần Mạnh Dũng</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCategoryModal}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Tags size={15} className="text-slate-500" />
            <span>Danh mục</span>
          </button>

          <button
            onClick={() => onNavigateTab('budgets')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <PiggyBank size={15} className="text-indigo-500" />
            <span>Ngân sách</span>
          </button>

          <button
            onClick={onOpenTransferModal}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            title="Chuyển vốn điều chuyển giữa các ví tài khoản"
          >
            <ArrowRightLeft size={15} className="text-emerald-500" />
            <span>Chuyển ví</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Giao dịch mới</span>
          </button>
        </div>
      </div>

      {/* Cảnh báo Ngân sách nếu có danh mục >= 80% hoặc >= 100% */}
      {alertItems.length > 0 && (
        <section aria-label="Cảnh báo ngân sách">
          <AlertBanner
            alerts={alertItems}
            summary={budgetProgress?.summary}
            compact={true}
            onNavigateToBudgets={() => onNavigateTab('budgets')}
          />
        </section>
      )}

      {/* 4 Thẻ Chỉ Số Tài Chính KPI (F11) */}
      <section aria-label="Thẻ chỉ số tài chính">
        <KPICards summary={summary} currentMonth={currentMonth} isLoading={isLoading} />
      </section>

      {/* Phân Tích Chỉ Số Sức Khỏe Tài Chính FinTech (Year-4 Feature) */}
      <section aria-label="Sức khỏe tài chính cá nhân">
        <FinancialHealthCard summary={summary} budgetProgress={budgetProgress} wallets={wallets} />
      </section>

      {/* 3 Thẻ Ví Tài Khoản (F12) */}
      <section aria-label="Ví tài khoản">
        <WalletCards
          wallets={wallets}
          selectedWalletId={null}
          onSelectWallet={onSelectWallet}
          isLoading={isLoading}
        />
      </section>

      {/* Phân hệ Trực quan hóa Biểu đồ Recharts (Milestone 3 - F16, F17) */}
      <section aria-label="Biểu đồ phân tích tài chính" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Phân tích & Trực quan hóa Dữ liệu Chi tiêu</span>
          </h3>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            <span>Báo cáo chi tiết</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ Doughnut Phân tích Cơ cấu Danh mục (F16) */}
          <CategoryDoughnutChart month={currentMonth} initialType="expense" />

          {/* Biểu đồ Xu hướng Thu/Chi Đa tháng (F17) */}
          <CashFlowTrendChart year="2026" />
        </div>
      </section>

      {/* Top Khoản Chi Lớn Nhất & Mẹo Tài Chính (Milestone 3 - F18) */}
      <section aria-label="Top chi tiêu và tư vấn tài chính" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopExpenses month={currentMonth} limit={5} />
        <FinancialTips month={currentMonth} />
      </section>

      {/* Giao dịch gần đây nhất (Recent Transactions Preview Strip) */}
      <section aria-label="Giao dịch gần đây" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-500" />
              <span>Giao dịch mới cập nhật</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5 khoản thu chi mới nhất trong kỳ
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            <span>Xem toàn bộ sổ giao dịch</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <TransactionTable
          transactions={recentTransactions}
          wallets={wallets}
          page={1}
          limit={5}
          total={recentTransactions.length}
          onPageChange={() => {}}
          onLimitChange={() => {}}
          onEditTransaction={onOpenAddModal}
          onDeleteTransaction={removeTransaction}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * 2. TAB: TRANSACTIONS VIEW (Sổ giao dịch đầy đủ, bộ lọc đa tiêu chí F13, F14)
 * -----------------------------------------------------------------------------
 */
function TransactionsView({ onOpenAddModal, onOpenCategoryModal, onEditTransaction }) {
  const {
    transactions,
    wallets,
    categories,
    filters,
    pagination,
    setFilter,
    resetFilters,
    setPage,
    setLimit,
    removeTransaction,
    isLoading
  } = useFinancialData();

  // Thống kê nhanh dữ liệu đã lọc
  const summaryData = useMemo(() => ({
    count: pagination.total || (transactions || []).length,
    totalIncome: (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    totalExpense: (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }), [transactions, pagination]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sổ Giao dịch Thu & Chi
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tìm kiếm, phân loại đa tiêu chí theo ngày, loại thu/chi, ví và danh mục
          </p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        categories={categories}
        wallets={wallets}
        onOpenAddModal={onOpenAddModal}
        onOpenCategoryModal={onOpenCategoryModal}
        summaryData={summaryData}
      />

      <TransactionTable
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={(col) => {
          if (filters.sortBy === col) {
            setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setFilter('sortBy', col);
            setFilter('sortOrder', 'desc');
          }
        }}
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={removeTransaction}
        isLoading={isLoading}
      />
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * 3. TAB: CATEGORIES VIEW (Phân loại danh mục Thu/Chi F15)
 * -----------------------------------------------------------------------------
 */
function CategoriesView({ onOpenCategoryModal }) {
  const { categories } = useFinancialData();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Danh Mục Thu & Chi
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Phân loại nguồn tiền với bảng màu và hơn 35+ biểu tượng Lucide tài chính
          </p>
        </div>
        <button
          onClick={onOpenCategoryModal}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Mở trình quản lý danh mục</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chi tiêu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Danh mục Chi tiêu ({categories.filter(c => c.type === 'expense').length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categories.filter(c => c.type === 'expense').map(cat => (
              <div 
                key={cat.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icon} size={16} color={cat.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{cat.name}</p>
                  <p className="text-[10px] text-slate-400">{cat.transactionCount || 0} giao dịch</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thu nhập */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Danh mục Thu nhập ({categories.filter(c => c.type === 'income').length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categories.filter(c => c.type === 'income').map(cat => (
              <div 
                key={cat.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icon} size={16} color={cat.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{cat.name}</p>
                  <p className="text-[10px] text-slate-400">{cat.transactionCount || 0} giao dịch</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * 4. ROOT MAIN APP CONTENT: Tab Navigator & Global Modals
 * -----------------------------------------------------------------------------
 */
function MainAppContent() {
  // Theme Dark / Light mode (lưu localStorage)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('expense_tracker_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 5 Tabs: ['dashboard', 'transactions', 'categories', 'budgets', 'reports']
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal States
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [txnToEdit, setTxnToEdit] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAdmin } = useAuth();

  const {
    serverStatus,
    wallets,
    categories,
    budgetAlertCount,
    addTransaction,
    editTransaction,
    saveCategory,
    deleteCategory,
    setFilter,
    refreshAll
  } = useFinancialData();

  // Hiệu ứng Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('expense_tracker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('expense_tracker_theme', 'light');
    }
  }, [darkMode]);

  const handleOpenAddTxn = () => {
    setTxnToEdit(null);
    setIsTxnModalOpen(true);
  };

  const handleOpenEditTxn = (tx) => {
    setTxnToEdit(tx);
    setIsTxnModalOpen(true);
  };

  const handleSaveTransaction = async (formData) => {
    if (formData.id) {
      return await editTransaction(formData.id, formData);
    }
    return await addTransaction(formData);
  };

  const handleTransfer = async ({ fromWalletId, toWalletId, fromWalletName, toWalletName, amount, date, note, expenseCat, incomeCat }) => {
    // Giao dịch kép bảo toàn số dư (Double Entry Balancing)
    await addTransaction({
      walletId: fromWalletId,
      amount,
      type: 'expense',
      categoryId: expenseCat,
      date,
      note: `[Chuyển ví] Sang ${toWalletName} - ${note}`
    });
    await addTransaction({
      walletId: toWalletId,
      amount,
      type: 'income',
      categoryId: incomeCat,
      date,
      note: `[Nhận từ ví] ${fromWalletName} - ${note}`
    });
    if (refreshAll) await refreshAll();
  };

  const handleSelectWallet = (walletId) => {
    setFilter('walletId', walletId);
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* 1. Header Cố Định (Branding SV & Live Status Pill) */}
      <Header
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(prev => !prev)}
        onOpenExamModal={() => setIsExamModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        serverStatus={serverStatus}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
      />

      {/* 2. Thanh Điều Hướng 5 Tabs (F09) */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        budgetAlertCount={budgetAlertCount || 0}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 3. Vùng Nội Dung Chính Của Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenAddModal={handleOpenAddTxn}
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
            onSelectWallet={handleSelectWallet}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenAddModal={handleOpenAddTxn}
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
            onEditTransaction={handleOpenEditTxn}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView />
        )}

        {activeTab === 'reports' && (
          <ReportsView />
        )}

        {activeTab === 'system' && (
          <SystemAdminView />
        )}

        {activeTab === 'admin' && (
          <AdminUserManagementView />
        )}
      </main>

      {/* 4. Footer Học Thuật Đề 38 */}
      <Footer onOpenExamModal={() => setIsExamModalOpen(true)} />

      {/* 5. Cụm Modals Tương Tác */}
      <ExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        serverStatus={serverStatus}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        categories={categories}
        onTransferSuccess={handleTransfer}
      />

      <TransactionModal
        isOpen={isTxnModalOpen}
        onClose={() => {
          setIsTxnModalOpen(false);
          setTxnToEdit(null);
        }}
        onSave={handleSaveTransaction}
        editData={txnToEdit}
        categories={categories}
        wallets={wallets}
        onOpenCategoryModal={() => {
          setIsTxnModalOpen(false);
          setIsCategoryModalOpen(true);
        }}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onSaveCategory={saveCategory}
        onDeleteCategory={deleteCategory}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinancialProvider>
        <MainAppContent />
      </FinancialProvider>
    </AuthProvider>
  );
}
