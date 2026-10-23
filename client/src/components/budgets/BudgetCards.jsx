/**
 * client/src/components/budgets/BudgetCards.jsx
 * Danh sách thẻ hạn mức ngân sách theo từng danh mục
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React from 'react';
import BudgetProgressBar from './BudgetProgressBar';
import { formatVND } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/iconResolver';
import { Edit3, Trash2, PiggyBank, Plus, AlertOctagon } from 'lucide-react';

export default function BudgetCards({
  items = [],
  isLoading = false,
  onEditBudget,
  onDeleteBudget,
  onOpenSetModal,
  className = ''
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center">
          <PiggyBank size={28} />
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Chưa có hạn mức ngân sách nào
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Thiết lập hạn mức chi tiêu hàng tháng cho các danh mục quan trọng (Ăn uống, Nhà ở, Mua sắm) để chủ động kiểm soát tài chính.
        </p>
        <button
          onClick={onOpenSetModal}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all"
        >
          <Plus size={15} />
          <span>Thiết lập hạn mức ngay</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {items.map((item) => {
        const pct = Number(item.percentage) || 0;
        const isOver = pct >= 100;
        const isWarning = pct >= 80 && !isOver;

        let badgeClass = 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
        let statusBadgeText = 'An toàn';
        if (isOver) {
          badgeClass = 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 font-bold';
          statusBadgeText = 'Vượt hạn mức';
        } else if (isWarning) {
          badgeClass = 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 font-semibold';
          statusBadgeText = 'Sắp chạm trần';
        }

        return (
          <div
            key={item.id || item.categoryId}
            className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
              isOver
                ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-400/20'
                : isWarning
                ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-400/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Top row: Icon + Name + Actions */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.categoryColor || '#EF4444'}20`, color: item.categoryColor || '#EF4444' }}
                >
                  <CategoryIcon name={item.categoryIcon} size={20} color={item.categoryColor} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {item.categoryName}
                  </h4>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}>
                    {statusBadgeText} ({pct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditBudget && onEditBudget(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Chỉnh sửa hạn mức"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBudget && onDeleteBudget(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Xóa ngân sách"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Middle: Numbers overview */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Hạn mức tháng:</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {formatVND(item.limitAmount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Đã chi thực tế:</span>
                <span className={`font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatVND(item.spentAmount)}
                </span>
              </div>
            </div>

            {/* Bottom: Progress Bar */}
            <BudgetProgressBar
              percentage={pct}
              spentAmount={item.spentAmount}
              limitAmount={item.limitAmount}
              remainingAmount={item.remainingAmount}
              showLabels={true}
              showBadge={false}
              size="md"
            />
          </div>
        );
      })}
    </div>
  );
}
