import React from 'react';
import { GraduationCap, Heart, ShieldCheck, Database, Cpu } from 'lucide-react';

export default function Footer({ onOpenExamModal }) {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12 py-8 text-sm text-slate-600 dark:text-slate-400 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Cột 1: Thông tin đề tài */}
          <div className="space-y-1 text-center md:text-left">
            <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đề 38 — Môn Triển khai và quản trị hệ thống phần mềm
            </p>
          </div>

          {/* Cột 2: Thông tin sinh viên nhận diện chính thức */}
          <div className="text-center space-y-1">
            <button
              onClick={onOpenExamModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800/80 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>Sinh viên: Trần Mạnh Dũng — MSSV: DTC245160020</span>
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lớp: <span className="font-medium text-slate-700 dark:text-slate-300">K23.K1.KHMT K23A</span> | Ngày sinh: 30/07/2006
            </p>
          </div>

          {/* Cột 3: Stack công nghệ & Offline Shield */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-xs">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>React 18 + Vite 5</span>
            </span>
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Express + SQLite</span>
            </span>
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Offline Fallback 100%</span>
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <p>© 2026 Trần Mạnh Dũng (DTC245160020). Bảo lưu mọi quyền phục vụ bảo vệ bài thi.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Thiết kế đáp ứng tiêu chuẩn kiểm định phần mềm</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
