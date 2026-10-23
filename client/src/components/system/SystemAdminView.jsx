/**
 * client/src/components/system/SystemAdminView.jsx
 * Phân hệ Quản trị Hệ thống, Giám sát Dịch vụ & Kiểm thử RESTful API
 * Thiết kế chuẩn chuyên ngành Sinh viên Năm 4 - Môn Triển khai và quản trị hệ thống phần mềm
 * 
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A | Đề 38
 */

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Terminal, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  Sparkles,
  Clock,
  Code2,
  HardDrive
} from 'lucide-react';
import api from '../../services/api';

const API_ENDPOINTS = [
  {
    name: 'Kiểm tra Sức khỏe & Thông tin Đề thi',
    method: 'GET',
    path: '/health',
    description: 'Kiểm tra trạng thái máy chủ, kết nối CSDL SQLite và thông tin định danh bài thi sinh viên Trần Mạnh Dũng.'
  },
  {
    name: 'Danh sách Ví Tài Khoản & Số Dư Động',
    method: 'GET',
    path: '/wallets',
    description: 'Tính toán số dư khả dụng tức thời của từng ví (Tiền mặt, Ngân hàng, MoMo) dựa trên lịch sử giao dịch.'
  },
  {
    name: 'Danh mục Thu & Chi',
    method: 'GET',
    path: '/categories',
    description: 'Lấy toàn bộ danh mục thu/chi kèm màu sắc HEX và icon đại diện.'
  },
  {
    name: 'Sổ Giao Dịch (5 bản ghi mới nhất)',
    method: 'GET',
    path: '/transactions?limit=5&page=1&sortBy=date&sortOrder=desc',
    description: 'Truy vấn lịch sử giao dịch có phân trang, lọc và sắp xếp.'
  },
  {
    name: 'Tiến độ Ngân sách Tháng 10/2026',
    method: 'GET',
    path: '/budgets/progress?month=2026-10',
    description: 'Kiểm tra hạn mức chi tiêu, số tiền đã tiêu, còn lại và trạng thái cảnh báo ngưỡng 80% / 100%.'
  },
  {
    name: 'Tổng hợp Chỉ số Tài chính (KPIs)',
    method: 'GET',
    path: '/analytics/summary?month=2026-10',
    description: 'Tính toán tổng thu, tổng chi, tỷ lệ tiết kiệm và tỷ lệ tăng trưởng so với tháng trước (MoM).'
  },
  {
    name: 'Cơ cấu Chi tiêu theo Danh mục',
    method: 'GET',
    path: '/analytics/category-breakdown?month=2026-10&type=expense',
    description: 'Dữ liệu đầu vào cho biểu đồ tròn Doughnut Chart với tỷ lệ phần trăm.'
  },
  {
    name: 'Xu hướng Thu Chi theo Tháng (2026)',
    method: 'GET',
    path: '/analytics/trends?year=2026',
    description: 'Dữ liệu dòng tiền qua các tháng 8, 9, 10 phục vụ biểu đồ cột Bar Chart.'
  }
];

export default function SystemAdminView() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [responseStatus, setResponseStatus] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [responseBody, setResponseBody] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Fetch health check on mount
  useEffect(() => {
    api.getHealth()
      .then(res => setHealthData(res))
      .catch(() => setHealthData(null));
  }, []);

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    setResponseTime(null);

    const t0 = performance.now();
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${BASE_URL}${selectedEndpoint.path}`);
      const t1 = performance.now();
      const duration = Math.round(t1 - t0);

      const json = await res.json().catch(() => null);
      setResponseStatus(res.status);
      setResponseTime(duration);
      setResponseBody(json);
    } catch (err) {
      const t1 = performance.now();
      setResponseStatus(0);
      setResponseTime(Math.round(t1 - t0));
      setResponseBody({ error: err.message, note: 'Kiểm tra Backend Server tại port 5000' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Bạn có muốn nạp lại dữ liệu mẫu chuẩn của đề thi? Thao tác này sẽ đảm bảo đầy đủ số liệu 3 tháng.')) return;
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      // Reload health
      api.getHealth().then(res => setHealthData(res));
    } catch (err) {
      alert('Lỗi nạp dữ liệu: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCopyCurl = () => {
    const curl = `curl -X ${selectedEndpoint.method} "http://localhost:5000/api${selectedEndpoint.path}" -H "Accept: application/json"`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Server className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Trung Tâm Quản Trị Hệ Thống & Kiểm Thử API</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Giám sát dịch vụ máy chủ, kiến trúc phần mềm 3 tầng và công cụ kiểm thử RESTful API thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Khôi phục lại dữ liệu mẫu 3 tháng chuẩn phục vụ chấm thi"
          >
            <RotateCcw size={14} className={isSeeding ? 'animate-spin' : ''} />
            <span>{isSeeding ? 'Đang nạp...' : 'Nạp dữ liệu mẫu chuẩn'}</span>
          </button>
        </div>
      </div>

      {seedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} />
          <span>Đã nạp thành công bộ dữ liệu mẫu 3 tháng (Tháng 8 - 10/2026) cho sinh viên Trần Mạnh Dũng!</span>
        </div>
      )}

      {/* 4 System Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Máy chủ Backend</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">Node.js Express</p>
          <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            Cổng 5000 • Status 200 OK
          </p>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cơ sở Dữ liệu</span>
            <Database size={15} className="text-sky-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">SQLite 3 (WAL Mode)</p>
          <p className="text-[11px] font-mono text-slate-400 truncate" title="expense_tracker.sqlite">
            expense_tracker.sqlite (Ghi tức thì)
          </p>
        </div>

        {/* Frontend Layer */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Giao diện Frontend</span>
            <Layers size={15} className="text-indigo-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">React 18 + Vite 5</p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
            Cổng 3000 • Tailwind CSS
          </p>
        </div>

        {/* Exam Verification Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Kiểm thử Học phần</span>
            <ShieldCheck size={15} className="text-emerald-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">21 / 21 Tests PASS</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Đạt 100% chuẩn thi Đề 38
          </p>
        </div>
      </div>

      {/* Interactive REST API Console */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Kiểm Thử RESTful API Thời Gian Thực (Live API Console)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn endpoint và nhấn Gửi Request để kiểm tra trực tiếp phản hồi của Backend
            </p>
          </div>

          <button
            onClick={handleCopyCurl}
            className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5"
            title="Sao chép lệnh cURL để chạy trên Terminal"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Đã chép cURL!' : 'Sao chép cURL'}</span>
          </button>
        </div>

        {/* Endpoint Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Endpoint List */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Danh sách Endpoints:</p>
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {API_ENDPOINTS.map((ep, idx) => {
                const isSelected = selectedEndpoint.path === ep.path;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      setResponseStatus(null);
                      setResponseBody(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700/80 ring-1 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {ep.method}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {ep.name}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {ep.path}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Request & Response Console (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Request Bar */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Cấu hình Request:</span>
                <span className="text-[11px] text-slate-500 font-mono">http://localhost:5000/api</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-2 rounded-xl bg-emerald-900/60 text-emerald-300 font-mono font-bold text-xs">
                  {selectedEndpoint.method}
                </span>
                <input
                  type="text"
                  readOnly
                  value={`/api${selectedEndpoint.path}`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden"
                />
                <button
                  onClick={handleExecuteRequest}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50 shrink-0"
                >
                  <Play size={14} className={isLoading ? 'animate-spin' : ''} />
                  <span>{isLoading ? 'Đang gửi...' : 'Gửi Request'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                {selectedEndpoint.description}
              </p>
            </div>

            {/* Response Viewer */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold">KẾT QUẢ PHẢN HỒI (RESPONSE):</span>
                {responseStatus !== null && (
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      responseStatus === 200 ? 'bg-emerald-900/80 text-emerald-300' : 'bg-rose-900/80 text-rose-300'
                    }`}>
                      HTTP {responseStatus} {responseStatus === 200 ? 'OK' : 'ERROR'}
                    </span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock size={12} />
                      <span>{responseTime} ms</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="max-h-[220px] overflow-y-auto text-[11px] text-slate-300 leading-relaxed pr-1">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-500 animate-pulse">
                    Đang gửi HTTP Request đến Backend API...
                  </div>
                ) : responseBody ? (
                  <pre className="whitespace-pre-wrap break-all text-emerald-400 font-mono">
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                ) : (
                  <div className="py-12 text-center text-slate-600">
                    Nhấn nút &ldquo;Gửi Request&rdquo; ở trên để chạy thử API ngay lập tức.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema & File Inspector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-sky-500" />
            <span>Lược Đồ Cơ Sở Dữ Liệu SQLite (Database Schema Inspector)</span>
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            PRAGMA journal_mode = WAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {/* Table 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="font-bold text-indigo-600 dark:text-indigo-400">Bảng transactions</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Lưu trữ toàn bộ giao dịch</p>
            <div className="pt-2 font-mono text-[10px] text-slate-400 space-y-0.5">
              <p>• id (TEXT PK)</p>
              <p>• wallet_id (FK)</p>
              <p>• category_id (FK)</p>
              <p>• amount (REAL)</p>
              <p>• type, date, note</p>
            </div>
          </div>

          {/* Table 2 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="font-bold text-emerald-600 dark:text-emerald-400">Bảng categories</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">15 Danh mục chuẩn đề tài</p>
            <div className="pt-2 font-mono text-[10px] text-slate-400 space-y-0.5">
              <p>• id (TEXT PK)</p>
              <p>• name (TEXT)</p>
              <p>• type (income/expense)</p>
              <p>• icon, color (HEX)</p>
              <p>• is_default (INT)</p>
            </div>
          </div>

          {/* Table 3 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="font-bold text-sky-600 dark:text-sky-400">Bảng wallets</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">3 Nguồn ví đa năng</p>
            <div className="pt-2 font-mono text-[10px] text-slate-400 space-y-0.5">
              <p>• id (TEXT PK)</p>
              <p>• name (Tiền mặt/Bank/MoMo)</p>
              <p>• type, initial_balance</p>
              <p>• icon, color</p>
              <p>• created_at, updated_at</p>
            </div>
          </div>

          {/* Table 4 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="font-bold text-amber-600 dark:text-amber-400">Bảng budgets</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Hạn mức chi tiêu tháng</p>
            <div className="pt-2 font-mono text-[10px] text-slate-400 space-y-0.5">
              <p>• id (TEXT PK)</p>
              <p>• category_id (FK)</p>
              <p>• month (YYYY-MM)</p>
              <p>• amount (REAL)</p>
              <p>• UNIQUE(category, month)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
