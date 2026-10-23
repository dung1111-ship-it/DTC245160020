/**
 * client/src/components/budgets/BudgetsView.jsx
 * Phân hệ Kế hoạch Ngân sách & Cảnh báo Chi tiêu (Milestone 3)
 * 
 * Đề tài: Đề 38 - Hệ thống Quản lý Chi tiêu / Expense Tracker
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import api from '../../services/api';
import { formatVND } from '../../utils/formatters';

// Modular Budget Components
import BudgetCards from './BudgetCards';
import BudgetModal from './BudgetModal';
import AlertBanner from './AlertBanner';

import { 
  PiggyBank, 
  AlertTriangle, 
  Plus, 
  Calendar,
  ShieldCheck,
  Target,
  Sparkles
} from 'lucide-react';

export default function BudgetsView() {
  const { categories, currentMonth, refreshFinancials, saveBudget, removeBudget } = useFinancialData();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth || '2026-10');
  const [budgetData, setBudgetData] = useState({ items: [], summary: {} });
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal set budget state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // Load budget progress & alerts
  const loadBudgets = useCallback(async (month) => {
    setIsLoading(true);
    try {
      const [progressRes, alertsRes] = await Promise.all([
        api.getBudgetProgress(month).catch(() => ({ items: [], summary: {} })),
        api.getAlerts(month).catch(() => [])
      ]);
      setBudgetData(progressRes || { items: [], summary: {} });
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu ngân sách:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets(selectedMonth);
  }, [selectedMonth, loadBudgets]);

  const handleOpenSetBudget = (item = null) => {
    setEditingBudget(item);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (data) => {
    if (saveBudget) {
      await saveBudget(data);
    } else {
      await api.setBudget(data);
      if (refreshFinancials) await refreshFinancials(selectedMonth);
    }
    await loadBudgets(selectedMonth);
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hạn mức ngân sách này?')) return;
    try {
      if (removeBudget) {
        await removeBudget(id);
      } else {
        await api.deleteBudget(id);
        if (refreshFinancials) await refreshFinancials(selectedMonth);
      }
      await loadBudgets(selectedMonth);
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa ngân sách');
    }
  };

  const summary = budgetData.summary || {};
  const totalBudget = Number(summary.totalBudgetLimit || summary.totalBudget) || 0;
  const totalSpent = Number(summary.totalBudgetSpent || summary.totalSpent) || 0;
  const remaining = Number(summary.remaining) || (totalBudget - totalSpent);
  const overallPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudgetCount = budgetData.items?.filter(b => (b.percentage || b.percentSpent) >= 100).length || 0;
  const warningCount = budgetData.items?.filter(b => (b.percentage || b.percentSpent) >= 80 && (b.percentage || b.percentSpent) < 100).length || 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <PiggyBank className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Kế Hoạch Ngân Sách & Cảnh Báo Chi Tiêu</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Thiết lập hạn mức danh mục, tự động giám sát tiến độ và cảnh báo vượt ngưỡng 80% & 100%
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar size={15} className="text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="2026-10">Tháng 10/2026 (Hiện tại)</option>
              <option value="2026-09">Tháng 09/2026</option>
              <option value="2026-08">Tháng 08/2026</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenSetBudget(null)}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Thiết lập hạn mức</span>
          </button>
        </div>
      </div>

      {/* Alert Banner Center */}
      <AlertBanner
        alerts={alerts}
        summary={summary}
        month={selectedMonth}
        compact={false}
      />

      {/* 4 KPI Cards for Budgeting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng hạn mức tháng</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatVND(totalBudget)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {budgetData.items?.length || 0} danh mục đã đặt hạn mức
          </p>
        </div>

        {/* Total Spent */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã chi tiêu thực tế</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatVND(totalSpent)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Chiếm {Math.round(overallPercent)}% tổng ngân sách
          </p>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ngân sách còn lại</p>
          <p className={`text-2xl font-black mt-1 ${remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatVND(remaining)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {remaining >= 0 ? 'Còn trong tầm kiểm soát' : 'Đã thâm hụt ngân sách'}
          </p>
        </div>

        {/* Health Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Trạng thái kỷ luật chi tiêu</p>
          <div className="mt-1 flex items-center gap-2">
            {overBudgetCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                <AlertTriangle size={14} />
                <span>{overBudgetCount} mục vượt mức</span>
              </span>
            ) : warningCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <AlertTriangle size={14} />
                <span>{warningCount} mục sắp hết</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={14} />
                <span>An toàn tuyệt đối</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Quy tắc: Xanh (&lt;80%), Vàng (&lt;100%), Đỏ (&gt;100%)
          </p>
        </div>
      </div>

      {/* Main Budget Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Tiến Độ Chi Tiêu Từng Danh Mục ({selectedMonth})</span>
          </h3>
        </div>

        <BudgetCards
          items={budgetData.items || []}
          isLoading={isLoading}
          onEditBudget={handleOpenSetBudget}
          onDeleteBudget={handleDeleteBudget}
          onOpenSetModal={() => handleOpenSetBudget(null)}
        />
      </div>

      {/* Student Savings Goals Widget */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 rounded-2xl border border-indigo-100 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
            <Target size={20} />
            <h3 className="text-sm font-bold">Mục Tiêu Tích Lũy Sinh Viên</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            K23.K1.KHMT K23A
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Goal 1 */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-800 dark:text-slate-200">Quỹ khẩn cấp 3 tháng</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">100%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Đạt: 10.000.000 ₫</span>
              <span>Mục tiêu: 10.000.000 ₫</span>
            </div>
          </div>

          {/* Goal 2 */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-800 dark:text-slate-200">Laptop Đồ Án Tốt Nghiệp</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">65%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Đạt: 13.000.000 ₫</span>
              <span>Mục tiêu: 20.000.000 ₫</span>
            </div>
          </div>

          {/* Goal 3 */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-800 dark:text-slate-200">Khóa học Cloud & DevOps</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">40%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '40%' }}></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Đạt: 2.000.000 ₫</span>
              <span>Mục tiêu: 5.000.000 ₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        initialData={editingBudget}
        categories={categories}
        currentMonth={selectedMonth}
      />
    </div>
  );
}
