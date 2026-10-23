/**
 * client/src/components/auth/AuthModal.jsx
 * Hộp Thoại Đăng Nhập & Đăng Ký Tài Khoản Công Khai
 * Tích hợp Phím tắt Đăng Nhập Nhanh tiện lợi khi thi cử
 * 
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LogIn, 
  UserPlus, 
  Lock, 
  User, 
  Mail, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  GraduationCap,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, quickLoginAdmin, quickLoginDemo } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username,
        email,
        password,
        fullName,
        studentId
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể đăng ký tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await quickLoginAdmin();
      onClose();
    } catch (err) {
      setError('Lỗi đăng nhập Admin: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError('');
    setIsLoading(true);
    try {
      await quickLoginDemo();
      onClose();
    } catch (err) {
      setError('Lỗi đăng nhập Demo: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LogIn size={14} />
              <span>Đăng Nhập</span>
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserPlus size={14} />
              <span>Đăng Ký Tài Khoản</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 animate-fadeIn">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Đăng Nhập */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="admin hoặc email..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <User size={15} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu của bạn..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>

            {/* Quick Login Bar (Tuyệt chiêu phòng thi) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
                Phím tắt Đăng Nhập Nhanh (Dành cho Giám Khảo):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickAdmin}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition text-left flex items-center gap-2"
                >
                  <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] truncate">Admin: Trần Mạnh Dũng</p>
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-mono">admin / admin123</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleQuickDemo}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 transition text-left flex items-center gap-2"
                >
                  <User size={16} className="text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] truncate">User: Sinh viên Demo</p>
                    <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-mono">demo_user / user123</p>
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Form Đăng Ký Tài Khoản Mới */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ và tên đầy đủ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã sinh viên (Nếu có)
                </label>
                <input
                  type="text"
                  placeholder="DTC245..."
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận lại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/30 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Đang khởi tạo tài khoản...' : 'Tạo Tài Khoản Người Dùng Mới'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
