/**
 * client/src/components/dashboard/WalletCards.jsx
 * Interactive Multi-Wallet Overview Cards
 * 
 * Đề 38 - Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState } from 'react';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { formatVND, formatCompactVND } from '../../utils/formatters';

// Cấu hình nhận diện thương hiệu và style từng loại ví
const WALLET_CONFIGS = {
  cash: {
    title: 'Tiền mặt',
    subtitle: 'Ví tiền mặt hàng ngày',
    icon: Banknote,
    gradient: 'from-emerald-500 to-teal-700',
    lightBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentColor: '#10B981',
    badgeText: 'Tiền mặt'
  },
  bank: {
    title: 'Tài khoản Ngân hàng',
    subtitle: 'Thẻ ATM / Tài khoản Ngân hàng',
    icon: CreditCard,
    gradient: 'from-blue-600 via-indigo-600 to-slate-900',
    lightBorder: 'border-blue-200 dark:border-blue-800/60',
    accentColor: '#3B82F6',
    badgeText: 'Thẻ ATM'
  },
  ewallet: {
    title: 'Ví điện tử Momo',
    subtitle: 'Ví thanh toán trực tuyến',
    icon: Smartphone,
    gradient: 'from-pink-600 via-rose-600 to-purple-800',
    lightBorder: 'border-pink-200 dark:border-pink-800/60',
    accentColor: '#EC4899',
    badgeText: 'Momo Pay'
  }
};

export function WalletCards({
  wallets = [],
  selectedWalletId = null,
  onSelectWallet = () => {},
  isLoading = false
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyAccount = (e, text, id) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Đảm bảo luôn đủ 3 ví chuẩn theo tài liệu đề tài
  const displayWallets = wallets.length > 0 ? wallets : [
    { id: 'cash', name: 'Tiền mặt', type: 'cash', currentBalance: 0, totalIncome: 0, totalExpense: 0, sharePercentage: 0 },
    { id: 'bank', name: 'Tài khoản Ngân hàng (ATM)', type: 'bank', currentBalance: 0, totalIncome: 0, totalExpense: 0, sharePercentage: 0 },
    { id: 'ewallet', name: 'Ví điện tử (Momo)', type: 'ewallet', currentBalance: 0, totalIncome: 0, totalExpense: 0, sharePercentage: 0 }
  ];

  // Tính tổng số dư của cả 3 ví để tính tỷ trọng nếu chưa có sẵn
  const totalBalanceAll = displayWallets.reduce((s, w) => s + Math.max(Number(w.currentBalance) || 0, 0), 0);

  return (
    <div className="space-y-3">
      {/* Tiêu đề & Hành động */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center">
            <span>Ví & Tài khoản thanh toán</span>
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              (Bấm vào thẻ để lọc giao dịch theo ví)
            </span>
          </h3>
        </div>
        {selectedWalletId && selectedWalletId !== 'all' && (
          <button
            onClick={() => onSelectWallet('all')}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Filter className="w-3 h-3 mr-1" />
            Bỏ lọc ví (Xem tất cả)
          </button>
        )}
      </div>

      {/* Grid 3 thẻ tài khoản */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {displayWallets.map((wallet) => {
          const config = WALLET_CONFIGS[wallet.id] || WALLET_CONFIGS.cash;
          const IconComponent = config.icon;
          const isSelected = selectedWalletId === wallet.id;
          const hasAccountNumber = Boolean(wallet.accountNumber || wallet.account_number);
          const accountNumber = wallet.accountNumber || wallet.account_number || '';
          const share = wallet.sharePercentage !== undefined
            ? wallet.sharePercentage
            : (totalBalanceAll > 0 ? Math.round((Math.max(Number(wallet.currentBalance) || 0, 0) / totalBalanceAll) * 100) : 0);

          return (
            <div
              key={wallet.id}
              onClick={() => onSelectWallet(isSelected ? 'all' : wallet.id)}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                isSelected
                  ? 'ring-2 ring-indigo-500 shadow-md ring-offset-2 dark:ring-offset-slate-950 scale-[1.01]'
                  : 'border border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}
            >
              {/* Nền Gradient Fintech sang trọng */}
              <div
                className={`p-5 text-white bg-gradient-to-br ${config.gradient} relative z-0 flex flex-col justify-between h-48`}
              >
                {/* Lớp vân nền ánh sáng trang trí */}
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

                {/* Hàng trên: Biểu tượng ví + Tên loại ví + Badge chọn */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm tracking-wide text-white drop-shadow-sm">
                        {wallet.name || config.title}
                      </h4>
                      <p className="text-[11px] text-white/80 font-light">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isSelected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-slate-900 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Đang lọc
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/25 text-white/90 backdrop-blur-sm">
                        {config.badgeText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hàng giữa: Số tài khoản & Chip EMV */}
                <div className="my-auto relative z-10 flex items-center justify-between">
                  <div className="text-xs tracking-widest font-mono text-white/90 flex items-center space-x-1.5">
                    <span>{hasAccountNumber ? accountNumber : 'VÍ THANH TOÁN'}</span>
                    {hasAccountNumber && (
                      <button
                        title="Sao chép số tài khoản"
                        onClick={(e) => handleCopyAccount(e, accountNumber, wallet.id)}
                        className="p-1 hover:bg-white/20 rounded transition-colors text-white/80"
                      >
                        {copiedId === wallet.id ? (
                          <Check className="w-3 h-3 text-emerald-300" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  {/* Tỷ trọng trong tổng tài sản ròng */}
                  <div className="text-[11px] text-white/85 font-medium bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {share}% tài sản
                  </div>
                </div>

                {/* Hàng dưới: Số dư lớn + Thống kê Thu / Chi */}
                <div className="relative z-10 pt-2 border-t border-white/15 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/75 font-light">
                      Số dư khả dụng
                    </div>
                    <div className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow">
                      {formatVND(wallet.currentBalance)}
                    </div>
                  </div>

                  <div className="text-right text-[11px] space-y-0.5 text-white/90">
                    <div className="flex items-center justify-end text-emerald-200">
                      <ArrowDownLeft className="w-3 h-3 mr-0.5 inline" />
                      <span>+{formatCompactVND(wallet.totalIncome || wallet.incomeSum || 0)}</span>
                    </div>
                    <div className="flex items-center justify-end text-rose-200">
                      <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                      <span>-{formatCompactVND(wallet.totalExpense || wallet.expenseSum || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WalletCards;
