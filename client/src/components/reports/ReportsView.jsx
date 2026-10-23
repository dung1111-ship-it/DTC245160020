/**
 * client/src/components/reports/ReportsView.jsx
 * Phân hệ Báo cáo Phân tích Tài chính & Xuất Dữ liệu
 * Tích hợp Recharts: Category Doughnut Chart, Cash Flow Trends, Top Expenses, Financial Tips
 * 
 * Đề tài: Đề 38 - Hệ thống Quản lý Chi tiêu / Expense Tracker
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 */

import React, { useState } from 'react';
import { useFinancialData } from '../../context/FinancialContext';
import {
  CategoryDoughnutChart,
  CashFlowTrendChart,
  TopExpenses,
  FinancialTips
} from '../analytics';
import {
  BarChart3,
  Download,
  Printer,
  Calendar
} from 'lucide-react';

export default function ReportsView() {
  const { currentMonth, transactions } = useFinancialData();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth || '2026-10');

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    try {
      const headers = ['Mã GD', 'Ngày', 'Loại', 'Số tiền (VND)', 'Danh mục', 'Ví thanh toán', 'Ghi chú'];
      const rows = (transactions || []).map(t => [
        t.id,
        t.date || t.transactionDate,
        t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
        t.amount,
        t.categoryName || t.category || '',
        t.walletName || t.walletId || '',
        `"${(t.note || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_Cao_Thu_Chi_${selectedMonth}_DTC245160020.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Lỗi xuất file: ' + err.message);
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Báo Cáo Phân Tích & Xuất Dữ Liệu</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trực quan hóa cấu trúc thu chi với Recharts, phân tích xu hướng dòng tiền và xuất file báo cáo
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar size={15} className="text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="2026-10">Tháng 10/2026</option>
              <option value="2026-09">Tháng 09/2026</option>
              <option value="2026-08">Tháng 08/2026</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            title="Xuất file CSV chuẩn UTF-8 xem trên Excel"
          >
            <Download size={15} className="text-emerald-500" />
            <span>Xuất Excel / CSV</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            title="In báo cáo hoặc lưu ra file PDF"
          >
            <Printer size={15} className="text-indigo-500" />
            <span>In / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Printable Exam Header (Chỉ hiện khi In) */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-black text-center uppercase tracking-wide">
          BÁO CÁO PHÂN TÍCH TÀI CHÍNH CÁ NHÂN
        </h1>
        <div className="mt-3 grid grid-cols-2 text-sm">
          <div>
            <p><strong>Sinh viên:</strong> Trần Mạnh Dũng</p>
            <p><strong>Mã sinh viên:</strong> DTC245160020</p>
            <p><strong>Lớp:</strong> K23.K1.KHMT K23A</p>
          </div>
          <div className="text-right">
            <p><strong>Học phần:</strong> Triển khai và quản trị hệ thống phần mềm</p>
            <p><strong>Đề bài:</strong> Đề 38 - Hệ thống Quản lý Chi tiêu</p>
            <p><strong>Kỳ báo cáo:</strong> {selectedMonth}</p>
          </div>
        </div>
      </div>

      {/* 3. Row 1: Charts (2 Cột Doughnut + Cash Flow) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDoughnutChart month={selectedMonth} />
        <CashFlowTrendChart year="2026" />
      </div>

      {/* 4. Row 2: Top Expenses & Financial Advice (2:1 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopExpenses month={selectedMonth} limit={5} />
        </div>
        <div className="lg:col-span-1">
          <FinancialTips month={selectedMonth} />
        </div>
      </div>
    </div>
  );
}
