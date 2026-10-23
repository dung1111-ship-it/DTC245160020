import React, { useState } from 'react';
import { Search, X, Calendar, Filter, RotateCcw, Plus, Tags, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  categories = [],
  wallets = [],
  onOpenAddModal,
  onOpenCategoryModal,
  summaryData = { count: 0, totalIncome: 0, totalExpense: 0 }
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // Lọc danh sách danh mục theo loại đang chọn
  const filteredCategories = categories.filter(c => {
    if (filters.type === 'all' || !filters.type) return true;
    return c.type === filters.type;
  });

  const isFiltered = (filters.search && filters.search !== '') ||
    (filters.type && filters.type !== 'all') ||
    (filters.walletId && filters.walletId !== 'all') ||
    (filters.categoryId && filters.categoryId !== 'all') ||
    (filters.datePreset && filters.datePreset !== 'all' && filters.datePreset !== 'this_month') ||
    (filters.startDate && filters.startDate !== '') ||
    (filters.endDate && filters.endDate !== '');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-6 transition-colors">
      {/* Hàng 1: Search bar, Type buttons, Action CTAs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Tìm theo ghi chú, nơi chi tiêu, danh mục..."
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 placeholder-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Type Segmented Control */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => {
              onFilterChange('type', 'all');
              onFilterChange('categoryId', 'all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filters.type === 'all' || !filters.type
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              onFilterChange('type', 'income');
              onFilterChange('categoryId', 'all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
              filters.type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'
            }`}
          >
            <ArrowUpRight size={13} />
            Thu nhập
          </button>
          <button
            onClick={() => {
              onFilterChange('type', 'expense');
              onFilterChange('categoryId', 'all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
              filters.type === 'expense'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                : 'text-slate-500 hover:text-rose-600 dark:text-slate-400'
            }`}
          >
            <ArrowDownRight size={13} />
            Chi tiêu
          </button>
        </div>

        {/* Action Buttons: Add Transaction + Manage Categories */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCategoryModal}
            className="px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
            title="Quản lý danh mục"
          >
            <Tags size={15} />
            <span className="hidden sm:inline">Danh mục</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Nút bật/tắt bộ lọc nâng cao trên mobile */}
      <div className="mt-3 flex md:hidden items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"
        >
          <Filter size={14} />
          <span>Bộ lọc chi tiết {isFiltered && '(Đang áp dụng)'}</span>
        </button>
        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="text-xs text-rose-500 flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* Hàng 2: Bộ lọc chi tiết (Date Presets, Wallets, Categories) */}
      <div className={`mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-col md:flex md:flex-row items-stretch md:items-center justify-between gap-3 ${
        mobileExpanded ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Thời gian */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400 pl-1.5">
              <Calendar size={13} />
            </span>
            {[
              { id: 'this_month', label: 'Tháng 10' },
              { id: 'prev_month', label: 'Tháng 9' },
              { id: 'all', label: 'Toàn bộ' },
              { id: 'custom', label: 'Khoảng ngày' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => onFilterChange('datePreset', p.id)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  filters.datePreset === p.id
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Ô nhập ngày tùy chọn khi datePreset === 'custom' */}
          {filters.datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 px-1.5 py-0.5 focus:outline-none"
              />
              <span className="text-slate-400">→</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 px-1.5 py-0.5 focus:outline-none"
              />
            </div>
          )}

          {/* Lọc Ví */}
          <select
            value={filters.walletId || 'all'}
            onChange={(e) => onFilterChange('walletId', e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Tất cả ví tài khoản</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({formatVND(w.currentBalance)})
              </option>
            ))}
          </select>

          {/* Lọc Danh mục */}
          <select
            value={filters.categoryId || 'all'}
            onChange={(e) => onFilterChange('categoryId', e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px] truncate"
          >
            <option value="all">Tất cả danh mục</option>
            {filteredCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'income' ? 'Thu' : 'Chi'})
              </option>
            ))}
          </select>
        </div>

        {/* Nút reset trên desktop */}
        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="hidden md:flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium whitespace-nowrap self-center"
          >
            <RotateCcw size={12} />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* Hàng 3: Dải thống kê tóm tắt các bản ghi đang lọc */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div>
          Hiển thị <span className="font-semibold text-slate-800 dark:text-slate-200">{summaryData.count}</span> giao dịch
        </div>
        <div className="flex items-center gap-3">
          <span>
            Thu: <strong className="text-emerald-600 dark:text-emerald-400">+{formatVND(summaryData.totalIncome)}</strong>
          </span>
          <span>•</span>
          <span>
            Chi: <strong className="text-rose-600 dark:text-rose-400">-{formatVND(summaryData.totalExpense)}</strong>
          </span>
          <span>•</span>
          <span>
            Ròng: <strong className={`font-semibold ${summaryData.totalIncome >= summaryData.totalExpense ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatVND(summaryData.totalIncome - summaryData.totalExpense)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
