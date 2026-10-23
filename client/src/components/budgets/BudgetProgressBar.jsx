/**
 * client/src/components/budgets/BudgetProgressBar.jsx
 * Thanh tiến độ đo lường ngân sách 3 dải màu (<80% xanh, 80-100% vàng, >100% đỏ nhấp nháy)
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React from 'react';
import { formatVND } from '../../utils/formatters';

export default function BudgetProgressBar({
  percentage = 0,
  spentAmount = 0,
  limitAmount = 0,
  remainingAmount = 0,
  showLabels = true,
  showBadge = false,
  size = 'md'
}) {
  const pct = Number(percentage) || 0;
  const isOver = pct >= 100;
  const isWarning = pct >= 80 && !isOver;

  let barColor = 'bg-emerald-500';
  let badgeClass = 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
  let statusText = 'An toàn';

  if (isOver) {
    barColor = 'bg-rose-500 animate-pulse';
    badgeClass = 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 font-bold';
    statusText = 'Vượt hạn mức';
  } else if (isWarning) {
    barColor = 'bg-amber-500';
    badgeClass = 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 font-semibold';
    statusText = 'Sắp chạm trần';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3.5' : 'h-2.5';
  const displayPct = Math.min(Math.max(pct, 0), 100);

  return (
    <div className="space-y-1.5 w-full">
      {showBadge && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-400">{statusText}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] border ${badgeClass}`}>
            {pct.toFixed(1)}%
          </span>
        </div>
      )}

      {/* Track */}
      <div className={`w-full bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <span>Đã chi: <strong className="text-slate-800 dark:text-slate-200">{formatVND(spentAmount)}</strong></span>
          <span>
            {remainingAmount >= 0 ? (
              <>Còn lại: <strong className="text-emerald-600 dark:text-emerald-400">{formatVND(remainingAmount)}</strong></>
            ) : (
              <>Vượt: <strong className="text-rose-600 dark:text-rose-400">+{formatVND(Math.abs(remainingAmount))}</strong></>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
