import React, { useState } from 'react';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, 
  Pencil, Trash2, Receipt, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { CategoryBadge, WalletIcon } from '../../utils/iconResolver';
import { formatVND, formatDateVN } from '../../utils/formatters';

export default function TransactionTable({
  transactions = [],
  wallets = [],
  categories = [],
  sortBy = 'date',
  sortOrder = 'desc',
  onSortChange,
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  onLimitChange,
  onEditTransaction,
  onDeleteTransaction,
  isLoading = false
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const renderSortIndicator = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="text-indigo-600 dark:text-indigo-400" />
      : <ArrowDown size={14} className="text-indigo-600 dark:text-indigo-400" />;
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
          <Receipt size={32} />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Chưa có giao dịch nào
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
          Không có dữ liệu giao dịch phù hợp với tiêu chí lọc của bạn. Hãy thử thay đổi bộ lọc hoặc thêm một khoản thu/chi mới.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* 1. DESKTOP / TABLET VIEW (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <th 
                className="py-3.5 px-4 cursor-pointer group hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                onClick={() => onSortChange && onSortChange('date')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Ngày giao dịch</span>
                  {renderSortIndicator('date')}
                </div>
              </th>
              <th className="py-3.5 px-4">Danh mục</th>
              <th className="py-3.5 px-4">Ghi chú & Đối tác</th>
              <th className="py-3.5 px-4">Ví thanh toán</th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer group hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                onClick={() => onSortChange && onSortChange('amount')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Số tiền</span>
                  {renderSortIndicator('amount')}
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <tr 
                  key={tx.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Ngày */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDateVN(tx.date || tx.transaction_date)}
                    </div>
                  </td>

                  {/* Danh mục */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <CategoryBadge 
                      name={tx.categoryName || tx.category_name || 'Khác'} 
                      icon={tx.categoryIcon || tx.category_icon || 'Folder'} 
                      color={tx.categoryColor || tx.category_color || '#6B7280'}
                    />
                  </td>

                  {/* Ghi chú & Đối tác */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-100 max-w-xs truncate">
                      {tx.note || <span className="text-slate-400 italic">Không có ghi chú</span>}
                    </div>
                    {(tx.payeePayer || tx.payee_payer) && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        Đ/tác: {tx.payeePayer || tx.payee_payer}
                      </div>
                    )}
                  </td>

                  {/* Ví */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      <WalletIcon walletId={tx.walletId || tx.wallet_id} size={13} />
                      <span>{tx.walletName || tx.wallet_name || (tx.walletId === 'cash' ? 'Tiền mặt' : tx.walletId === 'bank' ? 'Thẻ ATM' : 'Ví MoMo')}</span>
                    </div>
                  </td>

                  {/* Số tiền */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className={`font-bold font-mono text-sm ${
                      isIncome 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                    </span>
                  </td>

                  {/* Nút hành động */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Chỉnh sửa giao dịch"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tx)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Xóa giao dịch"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. MOBILE CARD VIEW (< md) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.map((tx) => {
          const isIncome = tx.type === 'income';
          return (
            <div key={tx.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <CategoryBadge 
                  name={tx.categoryName || tx.category_name || 'Khác'} 
                  icon={tx.categoryIcon || tx.category_icon || 'Folder'} 
                  color={tx.categoryColor || tx.category_color || '#6B7280'}
                />
                <span className="text-xs text-slate-400">
                  {formatDateVN(tx.date || tx.transaction_date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {tx.note || <span className="text-slate-400 italic">Không có ghi chú</span>}
                  </div>
                  {(tx.payeePayer || tx.payee_payer) && (
                    <div className="text-xs text-slate-400">
                      Đ/tác: {tx.payeePayer || tx.payee_payer}
                    </div>
                  )}
                </div>
                <div className={`font-bold font-mono text-base ${
                  isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-500 border-t border-slate-50 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                  <WalletIcon walletId={tx.walletId || tx.wallet_id} size={12} />
                  <span>{tx.walletName || tx.wallet_name || tx.walletId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditTransaction(tx)}
                    className="p-1 text-slate-500 hover:text-indigo-600"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(tx)}
                    className="p-1 text-slate-500 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION BAR) */}
      <div className="bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>bản ghi / trang (Tổng {total})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-200">
            Trang {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* POPUP XÁC NHẬN XÓA GIAO DỊCH */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Xác nhận xóa giao dịch?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Bạn có chắc chắn muốn xóa giao dịch{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  "{deleteTarget.note || 'Giao dịch không tên'}"
                </strong>{' '}
                trị giá{' '}
                <strong className="text-rose-600 font-mono">
                  {formatVND(deleteTarget.amount)}
                </strong>
                ? Hệ thống sẽ tự động hoàn trả số dư ví tương ứng.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-500/20 transition-all"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
