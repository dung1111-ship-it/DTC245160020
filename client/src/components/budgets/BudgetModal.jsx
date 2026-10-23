/**
 * client/src/components/budgets/BudgetModal.jsx
 * Modal thiết lập hạn mức ngân sách với các preset chip mệnh giá nhanh
 * 
 * Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState, useEffect } from 'react';
import { formatVND } from '../../utils/formatters';
import { PiggyBank, X, AlertCircle } from 'lucide-react';

export const BUDGET_PRESETS = [
  { label: '500k', value: 500000 },
  { label: '1 Triệu', value: 1000000 },
  { label: '2 Triệu', value: 2000000 },
  { label: '3 Triệu', value: 3000000 },
  { label: '5 Triệu', value: 5000000 },
  { label: '10 Triệu', value: 10000000 },
];

export default function BudgetModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories = [],
  currentMonth = '2026-10'
}) {
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(initialData && (initialData.categoryId || initialData.id));

  // Lọc chỉ lấy danh mục chi tiêu (expense)
  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategoryId(initialData.categoryId || initialData.category_id || '');
        setLimitAmount(String(initialData.limitAmount || initialData.limit_amount || ''));
      } else {
        setCategoryId(expenseCategories[0]?.id || '');
        setLimitAmount('3000000');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('Vui lòng chọn danh mục chi tiêu');
      return;
    }

    const numAmount = Number(limitAmount);
    if (!limitAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Hạn mức ngân sách phải là số dương lớn hơn 0 ₫');
      return;
    }

    setIsSubmitting(true);
    try {
      // Đảm bảo gửi đúng trường limitAmount theo contract của backend
      await onSave({
        id: initialData?.id,
        categoryId,
        month: currentMonth,
        limitAmount: numAmount,
        warningThreshold: 0.8
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu hạn mức ngân sách');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PiggyBank size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditMode ? 'Chỉnh Sửa Hạn Mức' : 'Thiết Lập Ngân Sách'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kỳ áp dụng: <strong className="text-indigo-600 dark:text-indigo-400">{currentMonth}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn Danh mục Chi tiêu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Danh mục chi tiêu <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isEditMode}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-75"
            >
              <option value="">-- Chọn danh mục chi tiêu --</option>
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Hạn mức ngân sách */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hạn mức ngân sách (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Ví dụ: 3000000"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              min="1000"
              step="1000"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Xem trước: <strong className="text-indigo-600 dark:text-indigo-400">{formatVND(Number(limitAmount) || 0)}</strong>
            </p>
          </div>

          {/* Preset Chips */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Mệnh giá gợi ý nhanh:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_PRESETS.map((preset) => {
                const isSelected = Number(limitAmount) === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setLimitAmount(String(preset.value))}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu hạn mức'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
