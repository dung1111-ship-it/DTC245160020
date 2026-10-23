import React, { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  Calendar, 
  Server, 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import api from '../../services/api';

export default function ExamModal({ isOpen, onClose, serverStatus }) {
  const [copied, setCopied] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Sinh viên & Bài thi thông tin chuẩn mực
  const studentInfo = {
    name: "Trần Mạnh Dũng",
    studentId: "DTC245160020",
    className: "K23.K1.KHMT K23A",
    dob: "30/07/2006",
    subject: "Triển khai và quản trị hệ thống phần mềm",
    topic: "Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính",
    department: "Khoa Công nghệ Thông tin",
  };

  useEffect(() => {
    if (isOpen) {
      setLoadingHealth(true);
      api.getHealth()
        .then(data => {
          if (data) {
            setHealthData(data);
          }
        })
        .catch(() => {
          // Gracefully fallback
        })
        .finally(() => setLoadingHealth(false));
    }
  }, [isOpen]);

  // Đóng modal khi nhấn ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyInfo = () => {
    const text = `Sinh viên: ${studentInfo.name}\nMSSV: ${studentInfo.studentId}\nLớp: ${studentInfo.className}\nNgày sinh: ${studentInfo.dob}\nMôn học: ${studentInfo.subject}\nĐề tài: ${studentInfo.topic}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header với dải màu thương hiệu trang trọng */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Bảo vệ Bài thi Kết thúc Học phần
              </span>
              <h2 className="text-lg font-bold text-white">
                Thông Tin Sinh Viên & Đề Tài Bảo Vệ
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Đóng modal (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Card Sinh viên */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                <User className="w-4 h-4" />
                <span>Hồ sơ Sinh viên thực hiện</span>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                K23 Chính quy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Họ và tên sinh viên</p>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{studentInfo.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mã số sinh viên (MSSV)</p>
                <p className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-base">{studentInfo.studentId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Lớp chuyên ngành</p>
                <p className="font-medium text-slate-700 dark:text-slate-200">{studentInfo.className}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ngày sinh</p>
                <p className="font-medium text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{studentInfo.dob}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card Đề tài & Học phần */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Nội dung Học phần & Đề tài Dự thi</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Học phần</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{studentInfo.subject}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tên đề tài</p>
              <p className="font-bold text-indigo-700 dark:text-indigo-300 text-base">{studentInfo.topic}</p>
            </div>
          </div>

          {/* Card Kiến trúc Hệ thống & Trạng thái Backend Thực tế */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
                <Server className="w-4 h-4 text-emerald-500" />
                <span>Trạng thái Triển khai Hệ thống</span>
              </div>
              {serverStatus?.isOnline ? (
                <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Backend REST API Hoạt động</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3 h-3" />
                  <span>Offline LocalStorage Fallback</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Cơ sở dữ liệu chính:</span>
                <p className="font-medium text-slate-700 dark:text-slate-200 mt-0.5 flex items-center space-x-1">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>{healthData?.database?.type || 'SQLite3 (better-sqlite3)'}</span>
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Cơ chế an toàn phòng thi:</span>
                <p className="font-medium text-slate-700 dark:text-slate-200 mt-0.5 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zero-blank Fallback 100%</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal với nút hành động */}
        <div className="bg-slate-100 dark:bg-slate-800/90 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCopyInfo}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép vào bộ nhớ!' : 'Sao chép thông tin báo cáo'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
