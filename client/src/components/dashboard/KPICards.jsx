/**
 * client/src/components/dashboard/KPICards.jsx
 * Financial KPI Overview Summary Cards
 * 
 * Đề 38 - Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { formatVND, formatPercentage, formatMonthYearVN } from '../../utils/formatters';

export function KPICards({ summary, currentMonth, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-3"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
          </div>
        ))}
      </div>
    );
  }

  const data = summary || {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    netSavings: 0,
    savingsRate: 0,
    isDeficit: false,
    comparison: {
      previousMonth: '',
      incomeGrowthRate: 0,
      expenseGrowthRate: 0
    }
  };

  const {
    totalBalance = 0,
    monthlyIncome = 0,
    monthlyExpense = 0,
    netSavings = 0,
    savingsRate = 0,
    isDeficit = false,
    comparison = {}
  } = data;

  const incomeGrowth = comparison.incomeGrowthRate || 0;
  const expenseGrowth = comparison.expenseGrowthRate || 0;

  // Đánh giá tỷ lệ tiết kiệm
  let savingsStatus = {
    label: 'Tích lũy tốt (≥20%)',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 ring-1 ring-emerald-600/20',
    barClass: 'bg-emerald-500',
    icon: ShieldCheck
  };

  if (isDeficit) {
    savingsStatus = {
      label: 'Bội chi ngân sách!',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 ring-1 ring-rose-600/20',
      barClass: 'bg-rose-500',
      icon: AlertTriangle
    };
  } else if (savingsRate < 20) {
    savingsStatus = {
      label: 'Mức trung bình (<20%)',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 ring-1 ring-amber-600/20',
      barClass: 'bg-amber-500',
      icon: AlertCircle
    };
  }

  const SavingsIcon = savingsStatus.icon;

  return (
    <div className="space-y-2">
      {/* Khung thời gian thống kê */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>Báo cáo tài chính: <strong className="font-semibold text-slate-700 dark:text-slate-200">{formatMonthYearVN(currentMonth || data.month || '2026-10')}</strong></span>
        <span>So sánh kỳ trước ({comparison.previousMonth ? formatMonthYearVN(comparison.previousMonth) : 'Tháng trước'})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* CARD 1: TỔNG TÀI SẢN RÒNG */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng số dư khả dụng
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {formatVND(totalBalance)}
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-600/20 mr-2">
                Khả dụng
              </span>
              <span>Tổng số dư trên các ví tài khoản</span>
            </div>
          </div>
        </div>

        {/* CARD 2: TỔNG THU NHẬP THÁNG */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Thu nhập tháng
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatVND(monthlyIncome)}
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              {incomeGrowth !== 0 ? (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium mr-2 ${
                    incomeGrowth > 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                  }`}
                >
                  {incomeGrowth > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {formatPercentage(Math.abs(incomeGrowth), 1)}
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mr-2">
                  0.0%
                </span>
              )}
              <span>so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* CARD 3: TỔNG CHI TIÊU THÁNG */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chi tiêu tháng
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatVND(monthlyExpense)}
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              {expenseGrowth !== 0 ? (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium mr-2 ${
                    expenseGrowth > 0
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
                >
                  {expenseGrowth > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {formatPercentage(Math.abs(expenseGrowth), 1)}
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mr-2">
                  0.0%
                </span>
              )}
              <span>so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* CARD 4: TỶ LỆ TÍCH LŨY (SAVINGS RATE) */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tỷ lệ tiết kiệm
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {savingsRate}%
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {netSavings >= 0 ? `+${formatVND(netSavings)}` : formatVND(netSavings)}
              </div>
            </div>

            {/* Thanh đo tiến độ tỷ lệ tiết kiệm so với mốc chuẩn 20% */}
            <div className="mt-2.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${savingsStatus.barClass}`}
                  style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${savingsStatus.badgeClass}`}>
                <SavingsIcon className="w-3 h-3 mr-1" />
                {savingsStatus.label}
              </span>
              <span className="text-[11px] text-slate-400">Mục tiêu 20%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KPICards;
