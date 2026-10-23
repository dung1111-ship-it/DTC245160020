/**
 * client/src/components/budgets/AlertBanner.jsx
 * Banner cảnh báo khi danh mục chạm 80% hoặc vượt 100% ngân sách
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React from 'react';
import { formatVND } from '../../utils/formatters';
import { AlertTriangle, AlertOctagon, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AlertBanner({
  alerts = [],
  summary,
  month = '2026-10',
  compact = false,
  onViewAllBudgets,
  onNavigateToBudgets,
  className = ''
}) {
  const handleNavigate = onViewAllBudgets || onNavigateToBudgets;

  if (!alerts || alerts.length === 0) {
    if (compact) return null;
    return (
      <div className={`p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-3 text-xs ${className}`}>
        <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-semibold">
          <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Kỷ luật chi tiêu tốt: Tất cả các danh mục trong tháng đang nằm trong hạn mức an toàn (&lt;80%).</span>
        </div>
      </div>
    );
  }

  const exceededItems = alerts.filter(a => a.status === 'exceeded' || Number(a.percentage) >= 100);
  const warningItems = alerts.filter(a => (a.status === 'warning' || Number(a.percentage) >= 80) && !exceededItems.includes(a));

  // COMPACT MODE (cho Dashboard)
  if (compact) {
    const isRed = exceededItems.length > 0;
    const bannerBg = isRed
      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200'
      : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-200';
    const iconColor = isRed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';
    const Icon = isRed ? AlertOctagon : AlertTriangle;

    return (
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${bannerBg} ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon size={18} className={`${iconColor} shrink-0`} />
          <div className="truncate">
            <span className="font-bold">
              {isRed
                ? `Cảnh báo: Có ${exceededItems.length} danh mục đã vượt trần ngân sách!`
                : `Lưu ý: Có ${warningItems.length} danh mục sắp chạm ngưỡng (≥80%)`}
            </span>
            <span className="hidden md:inline text-[11px] opacity-80 ml-2">
              {exceededItems.map(i => i.categoryName).concat(warningItems.map(i => i.categoryName)).join(', ')}
            </span>
          </div>
        </div>

        {handleNavigate && (
          <button
            type="button"
            onClick={handleNavigate}
            className="inline-flex items-center gap-1 font-bold text-xs hover:underline shrink-0 self-end sm:self-auto"
          >
            <span>Quản lý ngân sách</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    );
  }

  // FULL MODE (cho BudgetsView)
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Exceeded Alerts (Đỏ) */}
      {exceededItems.map((item) => (
        <div
          key={`exc_${item.id || item.categoryId}`}
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertOctagon size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-rose-700 dark:text-rose-300">
                Vượt hạn mức ngân sách: {item.categoryName}
              </p>
              <p className="text-[11px] text-rose-600/90 dark:text-rose-400 mt-0.5">
                Đã chi <strong>{formatVND(item.spentAmount)}</strong> / Hạn mức <strong>{formatVND(item.limitAmount)}</strong> ({Number(item.percentage).toFixed(1)}%). Vượt trần <strong>+{formatVND(Math.abs(item.remainingAmount))}</strong>.
              </p>
            </div>
          </div>
          <span className="self-end sm:self-auto px-2.5 py-1 rounded-full font-bold bg-rose-200/80 text-rose-800 dark:bg-rose-900 dark:text-rose-200 text-[11px] shrink-0">
            +{Number(item.percentage - 100).toFixed(1)}% vượt mức
          </span>
        </div>
      ))}

      {/* Warning Alerts (Vàng) */}
      {warningItems.map((item) => (
        <div
          key={`warn_${item.id || item.categoryId}`}
          className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-700 dark:text-amber-300">
                Sắp chạm ngưỡng ngân sách: {item.categoryName}
              </p>
              <p className="text-[11px] text-amber-600/90 dark:text-amber-400 mt-0.5">
                Đã chi <strong>{formatVND(item.spentAmount)}</strong> / Hạn mức <strong>{formatVND(item.limitAmount)}</strong> ({Number(item.percentage).toFixed(1)}%). Còn lại <strong>{formatVND(item.remainingAmount)}</strong>.
              </p>
            </div>
          </div>
          <span className="self-end sm:self-auto px-2.5 py-1 rounded-full font-semibold bg-amber-200/80 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[11px] shrink-0">
            {Number(item.percentage).toFixed(1)}% đã chi
          </span>
        </div>
      ))}
    </div>
  );
}
