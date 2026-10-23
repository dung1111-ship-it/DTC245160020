import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { WalletIcon } from '../../utils/iconResolver';
import { formatVND } from '../../utils/formatters';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  categories = [],
  wallets = [],
  onOpenCategoryModal
}) {
  const isEdit = Boolean(editData);

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    walletId: 'cash',
    categoryId: '',
    note: '',
    payeePayer: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khởi tạo hoặc cập nhật form khi editData thay đổi
  useEffect(() => {
    if (editData) {
      setFormData({
        type: editData.type || 'expense',
        amount: String(editData.amount || ''),
        date: editData.date || editData.transaction_date || new Date().toISOString().slice(0, 10),
        walletId: editData.walletId || editData.wallet_id || 'cash',
        categoryId: editData.categoryId || editData.category_id || '',
        note: editData.note || '',
        payeePayer: editData.payeePayer || editData.payee_payer || ''
      });
    } else {
      // Mặc định tạo mới
      const defaultCat = categories.find(c => c.type === 'expense');
      setFormData({
        type: 'expense',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        walletId: wallets[0]?.id || 'cash',
        categoryId: defaultCat ? defaultCat.id : '',
        note: '',
        payeePayer: ''
      });
    }
    setErrors({});
  }, [editData, isOpen, categories, wallets]);

  if (!isOpen) return null;

  // Lọc danh mục theo loại giao dịch đang chọn
  const availableCategories = categories.filter(c => c.type === formData.type);

  // Xử lý khi đổi Type (income <-> expense)
  const handleTypeChange = (newType) => {
    const validCats = categories.filter(c => c.type === newType);
    const isCurrentCatValid = validCats.some(c => c.id === formData.categoryId);
    setFormData(prev => ({
      ...prev,
      type: newType,
      categoryId: isCurrentCatValid ? prev.categoryId : (validCats[0]?.id || '')
    }));
  };

  // Thêm nhanh số tiền
  const handleAddQuickAmount = (delta) => {
    const current = Number(formData.amount) || 0;
    setFormData(prev => ({ ...prev, amount: String(current + delta) }));
    if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    const numAmount = Number(formData.amount);

    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Số tiền phải là số hợp lệ lớn hơn 0 ₫';
    }
    if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      newErrors.date = 'Ngày giao dịch không hợp lệ (định dạng YYYY-MM-DD)';
    }
    if (!formData.walletId) {
      newErrors.walletId = 'Vui lòng chọn ví thanh toán';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...(editData ? { id: editData.id } : {}),
        type: formData.type,
        amount: Number(formData.amount),
        date: formData.date,
        walletId: formData.walletId,
        categoryId: formData.categoryId,
        note: formData.note.trim(),
        payeePayer: formData.payeePayer.trim()
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Có lỗi xảy ra khi lưu giao dịch' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {isEdit ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung Form cuộn được */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errors.form && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 rounded-xl">
              {errors.form}
            </div>
          )}

          {/* 1. Loại Giao dịch: Thu nhập / Chi tiêu */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  formData.type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <ArrowDownRight size={15} />
                <span>Chi tiêu (Expense)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  formData.type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <ArrowUpRight size={15} />
                <span>Thu nhập (Income)</span>
              </button>
            </div>
          </div>

          {/* 2. Số tiền (Amount Input + Quick Chips) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Số tiền (VND) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="1000"
                value={formData.amount}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, amount: e.target.value }));
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
                }}
                placeholder="0"
                className={`w-full px-4 py-3 text-xl font-bold font-mono bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-2 ${
                  errors.amount
                    ? 'border-rose-400 focus:ring-rose-500 text-rose-600'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500 text-slate-800 dark:text-slate-100'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                ₫
              </span>
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>
            )}

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddQuickAmount(amt)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                >
                  {amt >= 1000000 ? `+${amt / 1000000}M` : `+${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Danh mục (Category Selector) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Danh mục <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                + Quản lý danh mục
              </button>
            </div>
            <select
              value={formData.categoryId}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, categoryId: e.target.value }));
                if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: null }));
              }}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 ${
                errors.categoryId
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500 text-slate-800 dark:text-slate-100'
              }`}
            >
              <option value="" disabled>-- Chọn danh mục --</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-rose-500 mt-1">{errors.categoryId}</p>
            )}
          </div>

          {/* 4. Ví thanh toán (Wallet Selector có số dư) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Ví thanh toán <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {wallets.map(w => {
                const isSelected = formData.walletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, walletId: w.id }));
                      if (errors.walletId) setErrors(prev => ({ ...prev, walletId: null }));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <WalletIcon walletId={w.id} size={15} />
                      <span className="text-xs font-bold truncate">{w.name}</span>
                    </div>
                    <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                      {formatVND(w.currentBalance)}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.walletId && (
              <p className="text-xs text-rose-500 mt-1">{errors.walletId}</p>
            )}
          </div>

          {/* 5. Ngày giao dịch (Date Picker) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Ngày giao dịch <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, date: new Date().toISOString().slice(0, 10) }))}
                  className="text-xs text-slate-500 hover:text-indigo-600 px-1"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setFormData(prev => ({ ...prev, date: yesterday.toISOString().slice(0, 10) }));
                  }}
                  className="text-xs text-slate-500 hover:text-indigo-600 px-1"
                >
                  Hôm qua
                </button>
              </div>
            </div>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, date: e.target.value }));
                if (errors.date) setErrors(prev => ({ ...prev, date: null }));
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
            {errors.date && (
              <p className="text-xs text-rose-500 mt-1">{errors.date}</p>
            )}
          </div>

          {/* 6. Ghi chú & Đối tác */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Ghi chú nội dung
              </label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ví dụ: Ăn trưa bún bò"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Đối tác / Nơi chi tiêu (tùy chọn)
              </label>
              <input
                type="text"
                value={formData.payeePayer}
                onChange={(e) => setFormData(prev => ({ ...prev, payeePayer: e.target.value }))}
                placeholder="Ví dụ: Quán Bún Bò Huế"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>{isEdit ? 'Lưu thay đổi' : 'Tạo giao dịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
