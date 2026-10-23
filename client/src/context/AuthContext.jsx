/**
 * client/src/context/AuthContext.jsx
 * Quản lý Trạng Thái Xác Thực & Phân Quyền Người Dùng (Authentication & RBAC)
 * 
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('expense_tracker_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('expense_tracker_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Đồng bộ thông tin người dùng từ server khi có token
  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (mounted && res) {
          setUser(res);
          localStorage.setItem('expense_tracker_user', JSON.stringify(res));
        }
      } catch (err) {
        console.warn('Phiên đăng nhập hết hạn hoặc server chưa phản hồi:', err.message);
        // Nếu lỗi 401 thì xóa token cũ
        if (err.status === 401) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('expense_tracker_token');
          localStorage.removeItem('expense_tracker_user');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadUser();
    return () => { mounted = false; };
  }, [token]);

  /**
   * Đăng nhập thông thường
   */
  const login = useCallback(async (username, password) => {
    const res = await api.login({ username, password });
    if (res && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('expense_tracker_token', res.token);
      localStorage.setItem('expense_tracker_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Dữ liệu phản hồi đăng nhập không hợp lệ');
  }, []);

  /**
   * Đăng ký tài khoản công khai
   */
  const register = useCallback(async (userData) => {
    const res = await api.register(userData);
    if (res && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('expense_tracker_token', res.token);
      localStorage.setItem('expense_tracker_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Dữ liệu phản hồi đăng ký không hợp lệ');
  }, []);

  /**
   * Đăng xuất
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('expense_tracker_token');
    localStorage.removeItem('expense_tracker_user');
  }, []);

  /**
   * Đăng nhập nhanh Admin (Trần Mạnh Dũng) - Tiện ích khi demo thi cử
   */
  const quickLoginAdmin = useCallback(async () => {
    return await login('admin', 'admin123');
  }, [login]);

  /**
   * Đăng nhập nhanh User thông thường (demo_user)
   */
  const quickLoginDemo = useCallback(async () => {
    return await login('demo_user', 'user123');
  }, [login]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user && user.role === 'admin'),
    isLoading,
    login,
    register,
    logout,
    quickLoginAdmin,
    quickLoginDemo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
