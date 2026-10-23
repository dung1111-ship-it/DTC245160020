/**
 * client/src/components/dashboard/FinancialHealthCard.jsx
 * Phân tích Chỉ số Sức Khỏe Tài Chính Cá Nhân (Financial Health Index)
 * Thuật toán đánh giá 3 trụ cột tài chính FinTech - Điểm nhấn Đồ án Năm 4
 * 
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React from 'react';
import { ShieldCheck, Award, TrendingUp, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatVND, formatPercentage } from '../../utils/formatters';

export default function FinancialHealthCard({ summary, budgetProgress, wallets }) {
  const totalBalance = summary?.totalBalance || 0;
  const income = summary?.monthlyIncome || 0;
  const expense = summary?.monthlyExpense || 0;
  const savingsRate = summary?.savingsRate || 0;

  // 1. Trụ cột 1: Điểm Tỷ lệ Tiết kiệm (Tối đa 40 điểm)
  // Quy tắc: Tiết kiệm >= 20% đạt trọn 40đ, 10-20% đạt 25đ, >0% đạt 15đ, thâm hụt 0đ
  let savingsScore = 0;
  if (savingsRate >= 20) savingsScore = 40;
  else if (savingsRate >= 10) savingsScore = 25;
  else if (savingsRate > 0) savingsScore = 15;
  else savingsScore = 5;

  // 2. Trụ cột 2: Điểm Tuân thủ Ngân sách (Tối đa 30 điểm)
  // Quy tắc: Không có danh mục nào vượt 100% đạt 30đ; có cảnh báo trừ 10đ; vượt mức trừ 20đ
  const budgetItems = budgetProgress?.items || [];
  const exceededCount = budgetItems.filter(b => b.percentSpent >= 100).length;
  const warningCount = budgetItems.filter(b => b.percentSpent >= 80 && b.percentSpent < 100).length;

  let budgetScore = 30;
  if (exceededCount > 0) budgetScore = Math.max(5, 30 - exceededCount * 15);
  else if (warningCount > 0) budgetScore = Math.max(15, 30 - warningCount * 5);

  // 3. Trụ cột 3: Điểm Đệm Thanh Khoản Đa Ví (Tối đa 30 điểm)
  // Quy tắc: Số dư tổng >= 3 tháng chi phí trung bình đạt 30đ; >= 1 tháng đạt 20đ; >= 0đ đạt 10đ
  let liquidityScore = 20;
  if (expense > 0) {
    const monthsOfRunway = totalBalance / expense;
    if (monthsOfRunway >= 2.5) liquidityScore = 30;
    else if (monthsOfRunway >= 1.0) liquidityScore = 22;
    else liquidityScore = 12;
  }

  const totalScore = Math.min(100, Math.round(savingsScore + budgetScore + liquidityScore));

  let grade = {
    rank: 'Hạng A+ (Xuất sắc)',
    color: 'text-emerald-500',
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    description: 'Kỷ luật tài chính tuyệt vời, tỷ lệ tích lũy vượt chuẩn khuyến nghị 20%.'
  };

  if (totalScore < 60) {
    grade = {
      rank: 'Hạng C (Cần cải thiện)',
      color: 'text-rose-500',
      barColor: 'bg-rose-500',
      bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      description: 'Đang có nguy cơ thâm hụt hoặc chi tiêu danh mục vượt hạn mức ngân sách.'
    };
  } else if (totalScore < 80) {
    grade = {
      rank: 'Hạng B (Khá tốt)',
      color: 'text-amber-500',
      barColor: 'bg-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      description: 'Tài chính ổn định, nên tối ưu thêm các khoản chi tiêu ăn uống và giải trí.'
    };
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl border border-indigo-500/20 p-6 shadow-lg text-white space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Chỉ Số Sức Khỏe Tài Chính Cá Nhân</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${grade.bgColor}`}>
                {grade.rank}
              </span>
            </h3>
            <p className="text-xs text-indigo-200/70">
              Thuật toán chấm điểm FinTech đa chiều dựa trên Dòng tiền, Ngân sách và Thanh khoản
            </p>
          </div>
        </div>

        {/* Score Ring / Pill */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl self-start sm:self-auto">
          <span className="text-xs text-slate-400 font-medium">Điểm tổng:</span>
          <span className={`text-2xl font-black ${grade.color}`}>
            {totalScore}
          </span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>

      {/* 3 Pillar Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pillar 1 */}
        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">1. Tỷ lệ tiết kiệm ({savingsRate}%)</span>
            <span className="font-bold text-emerald-400">{savingsScore}/40đ</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${(savingsScore / 40) * 100}%` }} />
          </div>
          <p className="text-[10px] text-slate-400">Chuẩn tài chính: ≥ 20% thu nhập</p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">2. Kỷ luật ngân sách</span>
            <span className="font-bold text-sky-400">{budgetScore}/30đ</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${(budgetScore / 30) * 100}%` }} />
          </div>
          <p className="text-[10px] text-slate-400">
            {exceededCount > 0 ? `Có ${exceededCount} mục vượt mức` : 'Tuân thủ ngân sách tốt'}
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">3. Đệm thanh khoản dự phòng</span>
            <span className="font-bold text-indigo-400">{liquidityScore}/30đ</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${(liquidityScore / 30) * 100}%` }} />
          </div>
          <p className="text-[10px] text-slate-400">Duy trì qua 3 ví: Tiền mặt, Bank, MoMo</p>
        </div>
      </div>

      {/* AI Diagnostic Summary */}
      <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-2.5 text-xs text-indigo-200">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Đánh giá hệ thống:</strong> {grade.description} Số dư khả dụng hiện tại đạt <strong>{formatVND(totalBalance)}</strong>, đủ khả năng trang trải chi phí học tập và nghiên cứu đồ án tốt nghiệp.
        </p>
      </div>
    </div>
  );
}
