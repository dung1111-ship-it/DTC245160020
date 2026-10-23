/**
 * client/src/components/analytics/TopExpenses.jsx
 * Danh sách Top 5 khoản chi tiêu lớn nhất trong kỳ
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatVND, formatDateVN, formatMonthYearVN } from '../../utils/formatters';
import { CategoryIcon, WalletIcon } from '../../utils/iconResolver';
import { Award, Receipt } from 'lucide-react';

export default function TopExpenses({
  month = '2026-10',
  limit = 5,
  onSelectTransaction,
  className = ''
}) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTop() {
      setIsLoading(true);
      try {
        const res = await api.getTopExpenses(month, limit);
        if (isMounted) {
          setExpenses(Array.isArray(res) ? res : (res?.items || []));
        }
      } catch (err) {
        console.warn('Lỗi khi tải Top Expenses:', err);
        if (isMounted) setExpenses([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchTop();
    return () => { isMounted = false; };
  }, [month, limit]);

  const maxAmount = expenses.length > 0 ? Number(expenses[0].amount) || 1 : 1;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Top {limit} Khoản Chi Lớn Nhất</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatMonthYearVN(month)} • Các khoản chi tiêu chiếm tỷ trọng lớn cần chú ý
          </p>
        </div>
      </div>

      {/* List Items */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-14 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        ) : expenses.length > 0 ? (
          expenses.map((tx, idx) => {
            const amount = Number(tx.amount) || 0;
            const ratioPercent = Math.min(100, Math.round((amount / maxAmount) * 100));

            // Ranking badge styling
            let rankBadgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400';
            if (idx === 0) rankBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 ring-1 ring-amber-400/40 font-black';
            else if (idx === 1) rankBadgeClass = 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 ring-1 ring-slate-400/40 font-bold';
            else if (idx === 2) rankBadgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 ring-1 ring-orange-400/40 font-bold';

            return (
              <div
                key={tx.id || idx}
                onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                className="group relative p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer overflow-hidden"
              >
                {/* Visual Proportion Bar Underlay */}
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-rose-500/30 dark:bg-rose-500/40 transition-all group-hover:h-1"
                  style={{ width: `${ratioPercent}%` }}
                />

                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center shrink-0 ${rankBadgeClass}`}>
                      #{idx + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tx.categoryColor || '#ef4444'}20`, color: tx.categoryColor || '#ef4444' }}
                    >
                      <CategoryIcon name={tx.categoryIcon} size={16} color={tx.categoryColor} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.note || tx.categoryName || 'Chi tiêu cá nhân'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatDateVN(tx.date || tx.transactionDate || tx.transaction_date)}</span>
                        <span>•</span>
                        <span className="truncate">{tx.categoryName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <WalletIcon walletId={tx.walletId || tx.wallet_id} size={11} />
                          <span>{tx.walletName || 'Chính'}</span>
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 block">
                      -{formatVND(amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {ratioPercent}% top 1
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p>Chưa có khoản chi nào trong kỳ {formatMonthYearVN(month)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
