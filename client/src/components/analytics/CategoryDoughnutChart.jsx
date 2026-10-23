/**
 * client/src/components/analytics/CategoryDoughnutChart.jsx
 * Biểu đồ cơ cấu thu/chi dạng Doughnut với Recharts
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector
} from 'recharts';
import api from '../../services/api';
import { formatVND, formatCompactVND, formatPercentage, formatMonthYearVN } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/iconResolver';
import { PieChart as PieIcon, TrendingDown, TrendingUp } from 'lucide-react';

const DEFAULT_PALETTE = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#64748b'
];

export default function CategoryDoughnutChart({
  month = '2026-10',
  initialType = 'expense',
  onCategorySelect,
  className = ''
}) {
  const [type, setType] = useState(initialType);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  // 1. Tải dữ liệu từ backend API / offline adapter
  useEffect(() => {
    let isMounted = true;
    async function fetchBreakdown() {
      setIsLoading(true);
      try {
        const res = await api.getCategoryBreakdown(month, type);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.warn('Lỗi khi tải cơ cấu danh mục:', err);
        if (isMounted) setData({ items: [], totalAmount: 0 });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchBreakdown();
    return () => { isMounted = false; };
  }, [month, type]);

  // 2. Định dạng dữ liệu cho Recharts Pie
  const items = data?.items || [];
  const totalAmount = data?.totalAmount || 0;

  const chartData = useMemo(() => {
    return items.map((item, idx) => ({
      id: item.categoryId,
      name: item.categoryName || 'Khác',
      value: Number(item.amount) || 0,
      percentage: Number(item.percentage) || 0,
      color: item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
      icon: item.icon,
      transactionCount: item.transactionCount || 0
    })).filter(d => d.value > 0);
  }, [items]);

  // 3. Custom Hover Shape (Hiệu ứng active slice mở rộng)
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))' }}
        />
      </g>
    );
  };

  // 4. Thông tin hiển thị tại tâm Doughnut (Center Text)
  const activeItem = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header & Type Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            <span>Cơ Cấu {type === 'expense' ? 'Chi Tiêu' : 'Thu Nhập'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatMonthYearVN(month)} • Tổng: <strong className={type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>{formatVND(totalAmount)}</strong>
          </p>
        </div>

        {/* Toggle Expense vs Income */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { setType('expense'); setActiveIndex(null); }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingDown size={13} />
            <span>Chi tiêu</span>
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setActiveIndex(null); }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Thu nhập</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas with Center Text Overlay */}
      <div className="relative py-3 h-72">
        {isLoading ? (
          <div className="h-full flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-indigo-500 animate-spin"></div>
          </div>
        ) : chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  cornerRadius={6}
                  dataKey="value"
                  nameKey="name"
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(entry) => onCategorySelect && onCategorySelect(entry.id)}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id || index}`}
                      fill={entry.color}
                      stroke="var(--color-slate-900, transparent)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CategoryChartTooltip totalAmount={totalAmount} />}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Absolute Center Text Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center select-none max-w-[120px]">
              {activeItem ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate block">
                    {activeItem.name}
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5 truncate">
                    {formatCompactVND(activeItem.value)}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-500 block">
                    {formatPercentage(activeItem.percentage)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    {type === 'expense' ? 'Tổng chi' : 'Tổng thu'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5">
                    {formatCompactVND(totalAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    {chartData.length} danh mục
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
              <PieIcon size={24} />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Chưa có dữ liệu {type === 'expense' ? 'chi tiêu' : 'thu nhập'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Trong kỳ {formatMonthYearVN(month)}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Legend with Badges & Percentages */}
      {chartData.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 text-xs">
            {chartData.map((item, index) => {
              const isHovered = activeIndex === index;
              return (
                <div
                  key={item.id || index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => onCategorySelect && onCategorySelect(item.id)}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isHovered
                      ? 'bg-slate-100 dark:bg-slate-800 shadow-xs ring-1 ring-slate-300 dark:ring-slate-700'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <CategoryIcon name={item.icon} size={14} color={item.color} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {formatVND(item.value)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {formatPercentage(item.percentage)} ({item.transactionCount} GD)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Tooltip Component
function CategoryChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl ring-1 ring-white/10 text-xs backdrop-blur-md space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="font-bold">{d.name}</span>
        </div>
        <div className="text-sm font-black text-rose-400">
          {formatVND(d.value)}
        </div>
        <div className="text-[10px] text-slate-300 flex items-center justify-between gap-4">
          <span>Tỷ trọng: <strong>{formatPercentage(d.percentage)}</strong></span>
          <span>{d.transactionCount} giao dịch</span>
        </div>
      </div>
    );
  }
  return null;
}
