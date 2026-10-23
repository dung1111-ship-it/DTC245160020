/**
 * client/src/components/admin/AdminUserManagementView.jsx
 * Phân Hệ Quản Trị Người Dùng & Phân Quyền (RBAC System Administration)
 * Tính năng chuẩn chuyên ngành Năm 4 - Môn Triển khai và quản trị hệ thống phần mềm
 * 
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Trash2, 
  RefreshCw, 
  Search, 
  Crown,
  KeyRound,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { formatDateVN } from '../../utils/formatters';

export default function AdminUserManagementView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.adminGetUsers().catch(() => ({ data: [] })),
        api.adminGetStats().catch(() => ({ data: null }))
      ]);

      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []));
      setStats(statsRes?.data || null);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu quản trị:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmText = targetUser.role === 'admin' 
      ? `Hạ cấp tài khoản [${targetUser.username}] xuống quyền User thông thường?`
      : `Thăng cấp tài khoản [${targetUser.username}] lên quyền Quản trị viên (ADMIN)?`;

    if (!window.confirm(confirmText)) return;

    try {
      await api.adminUpdateRole(targetUser.id, newRole);
      setActionMessage(`Đã cập nhật vai trò của [${targetUser.username}] thành ${newRole.toUpperCase()}`);
      setTimeout(() => setActionMessage(''), 3000);
      await loadData();
    } catch (err) {
      alert('Lỗi cập nhật quyền: ' + err.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.username === 'admin') {
      alert('Không thể xóa tài khoản Quản trị viên hệ thống gốc!');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản [${targetUser.username}] (${targetUser.fullName})?`)) {
      return;
    }

    try {
      await api.adminDeleteUser(targetUser.id);
      setActionMessage(`Đã xóa tài khoản [${targetUser.username}] thành công`);
      setTimeout(() => setActionMessage(''), 3000);
      await loadData();
    } catch (err) {
      alert('Lỗi xóa tài khoản: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = 
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const standardUserCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Quản Trị Người Dùng & Phân Quyền Hệ Thống (RBAC)</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý tài khoản công khai, phân quyền Quản trị viên (Admin) và Người dùng (User)
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng số tài khoản</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</p>
          <p className="text-[11px] text-slate-400">Người dùng đã đăng ký vào hệ thống</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quản trị viên (Admin)</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{adminCount}</p>
          <p className="text-[11px] text-slate-400">Quyền cao nhất, quản lý toàn hệ thống</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Người dùng thường (User)</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{standardUserCount}</p>
          <p className="text-[11px] text-slate-400">Quản lý thu chi & ví cá nhân</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mô hình phân quyền</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              RBAC Tiêu Chuẩn
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Bảo vệ bằng JWT Bearer Token</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo username, họ tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Lọc vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">Tất cả ({users.length})</option>
            <option value="admin">Quản trị viên ({adminCount})</option>
            <option value="user">Người dùng ({standardUserCount})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Người Dùng</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Mã SV</th>
                <th className="p-3.5">Vai Trò (Role)</th>
                <th className="p-3.5">Ngày Đăng Ký</th>
                <th className="p-3.5 text-right pr-5">Thao Tác Quản Trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin 
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30' 
                              : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          }`}>
                            {isAdmin ? <Crown size={14} /> : (u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.fullName || u.username}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                  Bạn
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {u.email}
                      </td>

                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {u.studentId || '-'}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isAdmin 
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                          <span>{isAdmin ? 'ADMINISTRATOR' : 'USER'}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500 dark:text-slate-400">
                        {formatDateVN(u.createdAt)}
                      </td>

                      <td className="p-3.5 text-right pr-5 space-x-1.5">
                        {u.username !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleToggleRole(u)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                isAdmin
                                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                              }`}
                              title={isAdmin ? 'Hạ cấp thành User' : 'Thăng cấp thành Admin'}
                            >
                              {isAdmin ? 'Hạ quyền User' : 'Cấp quyền Admin'}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Xóa tài khoản này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {u.username === 'admin' && (
                          <span className="text-[11px] text-slate-400 italic">Quản trị viên gốc</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Không tìm thấy người dùng phù hợp với tìm kiếm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
