/**
 * client/src/components/analytics/CashFlowTrendChart.jsx
 * Biểu đồ xu hướng dòng tiền (Income vs Expense) đa tháng với Area / Bar Chart
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../../services/api';
import { formatVND, formatCompactVND } from '../../utils/formatters';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function CashFlowTrendChart({
  year = '2026',
  period,
  className = ''
}) {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTrends() {
      setIsLoading(true);
      try {
        const queryParam = period || year || '2026';
        const res = await api.getTrends(queryParam);
        if (isMounted) {
          setTrends(Array.isArray(res) ? res : (res?.trends || []));
        }
      } catch (err) {
        console.warn('Lỗi khi tải xu hướng dòng tiền:', err);
        if (isMounted) setTrends([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchTrends();
    return () => { isMounted = false; };
  }, [year, period]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header & Chart Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Xu Hướng Dòng Tiền ({year})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            So sánh Thu nhập và Chi tiêu qua các tháng trong học kỳ
          </p>
        </div>

        {/* Toggle Area vs Bar */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              chartType === 'area'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Đồ thị Area</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              chartType === 'bar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={13} />
            <span>Cột Bar</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="py-3 h-72">
        {isLoading ? (
          <div className="h-full flex items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : trends.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  {/* Income Emerald Gradient */}
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Expense Rose Gradient */}
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />
                <YAxis
                  tickFormatter={(val) => formatCompactVND(val)}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  width={60}
                />
                <Tooltip content={<CashFlowTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => (
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {val === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                    </span>
                  )}
                  wrapperStyle={{ paddingTop: '10px' }}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="income"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="expense"
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />
                <YAxis
                  tickFormatter={(val) => formatCompactVND(val)}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  width={60}
                />
                <Tooltip content={<CashFlowTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => (
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {val === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                    </span>
                  )}
                  wrapperStyle={{ paddingTop: '10px' }}
                />

                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="income" maxBarSize={36} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="expense" maxBarSize={36} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Chưa có dữ liệu xu hướng cho năm {year}
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Tooltip for Cash Flow
function CashFlowTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const income = Number(item.income) || 0;
    const expense = Number(item.expense) || 0;
    const net = income - expense;
    const savingsRate = income > 0 && net > 0 ? ((net / income) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl ring-1 ring-white/10 text-xs backdrop-blur-md space-y-1.5 min-w-[180px]">
        <div className="font-bold border-b border-slate-700/60 pb-1 text-slate-200">
          {item.label || label}
        </div>
        <div className="flex items-center justify-between text-emerald-400">
          <span>Thu nhập:</span>
          <span className="font-black">+{formatVND(income)}</span>
        </div>
        <div className="flex items-center justify-between text-rose-400">
          <span>Chi tiêu:</span>
          <span className="font-black">-{formatVND(expense)}</span>
        </div>
        <div className="pt-1 border-t border-slate-700/60 flex items-center justify-between font-semibold text-slate-300">
          <span>Thặng dư:</span>
          <span className={net >= 0 ? 'text-indigo-400' : 'text-rose-400'}>
            {net >= 0 ? `+${formatVND(net)}` : formatVND(net)}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 text-right">
          Tỷ lệ tích lũy: <strong className="text-emerald-400">{savingsRate}%</strong>
        </div>
      </div>
    );
  }
  return null;
}
