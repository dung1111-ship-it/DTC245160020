/**
 * client/src/components/analytics/FinancialTips.jsx
 * Thẻ gợi ý và mẹo tối ưu tài chính cá nhân thông minh
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';

const STATIC_FALLBACK_TIPS = [
  {
    type: 'info',
    title: 'Quy tắc 50/30/20',
    content: 'Phân bổ 50% cho nhu cầu thiết yếu (nhà ở, ăn uống), 30% cho sở thích, và 20% cho quỹ tích lũy dự phòng.',
    category: 'Quy tắc tài chính'
  },
  {
    type: 'warning',
    title: 'Kiểm soát chi phí Ăn uống',
    content: 'Ăn uống là nhóm chi thường xuyên lớn nhất. Tự chuẩn bị bữa ăn 3 lần/tuần giúp tiết kiệm thêm 600.000đ/tháng.',
    category: 'Ăn uống'
  },
  {
    type: 'success',
    title: 'Quỹ khẩn cấp sinh viên',
    content: 'Mục tiêu xây dựng ví khẩn cấp tối thiểu 3 tháng sinh hoạt phí (khoảng 9.000.000đ) tại tài khoản ngân hàng.',
    category: 'Dự phòng'
  }
];

export default function FinancialTips({
  month = '2026-10',
  className = ''
}) {
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTips() {
      setIsLoading(true);
      try {
        const res = await api.getFinancialTips(month);
        if (isMounted) {
          const list = Array.isArray(res) ? res : (res?.tips || []);
          setTips(list.length > 0 ? list : STATIC_FALLBACK_TIPS);
        }
      } catch (err) {
        console.warn('Lỗi khi tải mẹo tài chính:', err);
        if (isMounted) setTips(STATIC_FALLBACK_TIPS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchTips();
    return () => { isMounted = false; };
  }, [month]);

  // Style mapping per tip type
  const getTipStyles = (type) => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertCircle,
          borderClass: 'border-rose-200 dark:border-rose-900/60',
          bgClass: 'bg-rose-50/70 dark:bg-rose-950/30',
          badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
          iconColor: 'text-rose-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          borderClass: 'border-amber-200 dark:border-amber-900/60',
          bgClass: 'bg-amber-50/70 dark:bg-amber-950/30',
          badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
          iconColor: 'text-amber-500'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          borderClass: 'border-emerald-200 dark:border-emerald-900/60',
          bgClass: 'bg-emerald-50/70 dark:bg-emerald-950/30',
          badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
          iconColor: 'text-emerald-500'
        };
      default:
        return {
          icon: Lightbulb,
          borderClass: 'border-indigo-100 dark:border-indigo-900/60',
          bgClass: 'bg-indigo-50/50 dark:bg-indigo-950/30',
          badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
          iconColor: 'text-indigo-500'
        };
    }
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 rounded-2xl border border-indigo-100 dark:border-slate-800 p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60 dark:border-slate-800">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-base font-bold">Mẹo Tối Ưu Tài Chính</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          AI Rule-based
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">
        Khuyến nghị thông minh theo thời gian thực dựa trên phân tích dòng tiền:
      </p>

      {/* Tip Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-white dark:bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        ) : (
          tips.map((tip, idx) => {
            const styles = getTipStyles(tip.type);
            const Icon = styles.icon;

            return (
              <div
                key={tip.id || idx}
                className={`p-3.5 rounded-xl border transition-all ${styles.bgClass} ${styles.borderClass} space-y-1.5`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Icon size={14} className={styles.iconColor} />
                    <span>{tip.title}</span>
                  </div>
                  {tip.category && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${styles.badgeClass}`}>
                      {tip.category}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tip.content || tip.message}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
