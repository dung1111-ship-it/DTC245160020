import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  Wallet,
  Menu,
  X,
  LogIn,
  LogOut,
  Crown,
  UserCheck
} from 'lucide-react';

export default function Header({ 
  darkMode, 
  onToggleTheme, 
  onOpenExamModal, 
  onOpenAuthModal,
  serverStatus,
  mobileMenuOpen,
  onToggleMobileMenu 
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Nhóm Logo & Tên Hệ Thống */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Mở thanh điều hướng"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Expense<span className="text-indigo-600 dark:text-indigo-400">Tracker</span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Quản lý Chi tiêu & Tài chính Cá nhân
              </p>
            </div>
          </div>
        </div>

        {/* Nhóm Nút Học thuật & Trạng thái Hệ thống */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Academic Badge nhận diện Đề 38 - Sinh viên Trần Mạnh Dũng (DTC245160020) */}
          <button
            onClick={onOpenExamModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all shadow-sm group"
            title="Bấm để xem chi tiết bài thi môn Triển khai phần mềm"
          >
            <GraduationCap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Đề 38:</span>
            <span className="font-bold">Trần Mạnh Dũng</span>
            <span className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 hidden md:inline">
              (DTC245160020)
            </span>
          </button>

          {/* User Account / Auth Control (RBAC) */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 pl-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  isAdmin ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {isAdmin ? <Crown size={12} /> : (user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U')}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[110px] leading-tight">
                    {user.fullName || user.username}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider block leading-none ${
                    isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                  }`}>
                    {user.role === 'admin' ? 'ADMIN' : 'USER'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 rounded-full transition"
                title="Đăng xuất tài khoản"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-full transition shadow-sm shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <LogIn size={13} />
              <span>Đăng Nhập</span>
            </button>
          )}

          {/* Status Pill: Trạng thái Server kết nối / Offline */}
          <div 
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              serverStatus?.isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
            title={serverStatus?.isOnline ? 'Đang kết nối Express API & SQLite Database' : 'Đang chạy chế độ Offline LocalStorage'}
          >
            {serverStatus?.isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="hidden sm:inline">Đã kết nối Server (Online)</span>
                <span className="sm:hidden">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Chế độ Ngoại tuyến / LocalStorage (Offline)</span>
                <span className="sm:hidden">Offline</span>
              </>
            )}
          </div>

          {/* Nút Chuyển đổi Dark / Light Theme */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
