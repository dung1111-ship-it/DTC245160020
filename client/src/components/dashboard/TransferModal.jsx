/**
 * client/src/components/dashboard/TransferModal.jsx
 * Modal Chuyển Tiền Giữa Các Ví (Wallet Transfer)
 * Tính năng FinTech đa ví chuyên nghiệp - Đề 38
 * 
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState } from 'react';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function TransferModal({
  isOpen,
  onClose,
  wallets,
  categories,
  onTransferSuccess
}) {
  const [fromWalletId, setFromWalletId] = useState(wallets[1]?.id || wallets[0]?.id || 'bank');
  const [toWalletId, setToWalletId] = useState(wallets[2]?.id || wallets[0]?.id || 'ewallet');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Chuyển tiền giữa các ví');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const fromWallet = wallets.find(w => w.id === fromWalletId);
  const toWallet = wallets.find(w => w.id === toWalletId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Số tiền chuyển phải là số dương lớn hơn 0');
      return;
    }

    if (fromWalletId === toWalletId) {
      setError('Ví chuyển và ví nhận phải khác nhau');
      return;
    }

    if (fromWallet && (fromWallet.currentBalance || 0) < numAmount) {
      setError(`Số dư ${fromWallet.name} không đủ để chuyển (Hiện có: ${formatVND(fromWallet.currentBalance)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Find or default a transfer category
      const expenseCat = categories.find(c => c.type === 'expense')?.id || 'cat_other';
      const incomeCat = categories.find(c => c.type === 'income')?.id || 'cat_other_inc';

      await onTransferSuccess({
        fromWalletId,
        toWalletId,
        fromWalletName: fromWallet?.name || fromWalletId,
        toWalletName: toWallet?.name || toWalletId,
        amount: numAmount,
        date,
        note,
        expenseCat,
        incomeCat
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi thực hiện chuyển tiền');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chuyển Tiền Giữa Các Ví
              </h3>
              <p className="text-[11px] text-slate-400">
                Điều chuyển vốn nội bộ không làm thay đổi tổng tài sản ròng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* From Wallet -> To Wallet Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Từ ví (Nguồn tiền)
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatVND(w.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Đến ví (Đích đến)
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatVND(w.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Số tiền muốn chuyển (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Ví dụ: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              required
              min="1000"
              step="1000"
            />
            {amount && (
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
                Số tiền: {formatVND(Number(amount))}
              </p>
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày thực hiện
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ghi chú điều chuyển
              </label>
              <input
                type="text"
                placeholder="Rút tiền / Nạp ví..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển tiền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
