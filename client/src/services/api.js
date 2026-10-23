/**
 * client/src/services/api.js
 * Unified API Client for Expense Tracker Backend with Seamless Offline Fallback
 * 
 * Đề 38 - Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 */

import storageAdapter from './storageAdapter';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom API Error class chứa mã lỗi HTTP và thông điệp từ server
 */
export class ApiError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let onStatusChangeCallback = null;
export function setNetworkStatusCallback(cb) {
  onStatusChangeCallback = cb;
}

function notifyStatus(isOnline) {
  if (onStatusChangeCallback) {
    try {
      onStatusChangeCallback(isOnline);
    } catch {
      // ignore
    }
  }
}

/**
 * Core HTTP Request Wrapper
 */
async function request(path, options = {}) {
  const { method = 'GET', body, query, headers = {}, timeout = 6000, ...rest } = options;

  let url = `${BASE_URL}${path}`;

  // Tự động gắn Bearer Token nếu đã đăng nhập
  const token = localStorage.getItem('expense_tracker_token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Query parameter serialization
  if (query && typeof query === 'object') {
    const qParams = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        qParams.append(k, String(v));
      }
    }
    const qs = qParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...headers
    },
    signal: controller.signal,
    ...rest
  };

  if (body !== undefined && body !== null) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timer);

    let json = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      json = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const errMsg = json?.error?.message || json?.message || `HTTP ${response.status} ${response.statusText}`;
      const errCode = json?.error?.code || 'HTTP_ERROR';
      throw new ApiError(errMsg, response.status, errCode, json);
    }

    // Tiêu chuẩn hóa Response Envelope
    if (json && typeof json === 'object') {
      if (json.success === true) {
        const result = json.data;
        if (json.meta && typeof result === 'object' && result !== null) {
          result.meta = json.meta;
        }
        return result;
      }
      throw new ApiError(json.message || 'Thao tác API không thành công', response.status, 'OPERATION_FAILED', json);
    }

    return json;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new ApiError('Yêu cầu hết thời gian chờ (Timeout)', 408, 'REQUEST_TIMEOUT');
    }
    if (err instanceof ApiError) {
      throw err;
    }
    // Lỗi mạng hoặc server không phản hồi
    throw new ApiError(
      'Không thể kết nối đến máy chủ Express backend. Vui lòng kiểm tra server tại port 5000.',
      0,
      'NETWORK_DISCONNECTED',
      err
    );
  }
}

/**
 * Proxy helper: Thử gọi remote server, nếu lỗi mạng thì fallback sang LocalStorage adapter
 */
async function withFallback(remoteFn, fallbackFn) {
  try {
    const result = await remoteFn();
    notifyStatus(true);
    return result;
  } catch (err) {
    // Nếu là lỗi mạng, server down hoặc timeout, tự động fallback sang LocalStorage adapter
    if (
      err.code === 'NETWORK_DISCONNECTED' ||
      err.code === 'REQUEST_TIMEOUT' ||
      err.status === 0 ||
      err.status >= 500
    ) {
      console.warn('[OfflineFallback] Backend Express không phản hồi, tự động chuyển đổi sang LocalStorage Adapter:', err.message);
      notifyStatus(false);
      return await fallbackFn();
    }
    // Lỗi validation 400 hoặc logic nghiệp vụ vẫn ném ra cho UI xử lý
    throw err;
  }
}

/**
 * ApiService Client Interface với cơ chế Fallback trong suốt
 */
export const api = {
  // 1. Health & Student Branding
  getHealth: () => withFallback(
    () => request('/health'),
    () => storageAdapter.getHealth()
  ),

  // 2. Wallets (Ví tài khoản)
  getWallets: () => withFallback(
    () => request('/wallets'),
    () => storageAdapter.getWallets()
  ),
  getWalletById: (id) => withFallback(
    () => request(`/wallets/${id}`),
    () => storageAdapter.getWalletById(id)
  ),
  createWallet: (data) => withFallback(
    () => request('/wallets', { method: 'POST', body: data }),
    () => storageAdapter.createWallet(data)
  ),
  updateWallet: (id, data) => withFallback(
    () => request(`/wallets/${id}`, { method: 'PUT', body: data }),
    () => storageAdapter.updateWallet(id, data)
  ),
  deleteWallet: (id) => withFallback(
    () => request(`/wallets/${id}`, { method: 'DELETE' }),
    () => storageAdapter.deleteWallet(id)
  ),

  // 3. Categories (Danh mục thu / chi)
  getCategories: (type) => withFallback(
    () => request('/categories', { query: type ? { type } : undefined }),
    () => storageAdapter.getCategories(type)
  ),
  getCategoryById: (id) => withFallback(
    () => request(`/categories/${id}`),
    () => storageAdapter.getCategoryById(id)
  ),
  createCategory: (data) => withFallback(
    () => request('/categories', { method: 'POST', body: data }),
    () => storageAdapter.createCategory(data)
  ),
  updateCategory: (id, data) => withFallback(
    () => request(`/categories/${id}`, { method: 'PUT', body: data }),
    () => storageAdapter.updateCategory(id, data)
  ),
  deleteCategory: (id, transferToCategoryId) => withFallback(
    () => request(`/categories/${id}`, { 
      method: 'DELETE', 
      query: transferToCategoryId ? { transferToCategoryId } : undefined 
    }),
    () => storageAdapter.deleteCategory(id, transferToCategoryId)
  ),

  // 4. Transactions (Giao dịch thu / chi)
  getTransactions: (filters = {}) => withFallback(
    () => request('/transactions', { query: filters }),
    () => storageAdapter.getTransactions(filters)
  ),
  getTransactionById: (id) => withFallback(
    () => request(`/transactions/${id}`),
    () => storageAdapter.getTransactionById(id)
  ),
  createTransaction: (data) => withFallback(
    () => request('/transactions', { method: 'POST', body: data }),
    () => storageAdapter.createTransaction(data)
  ),
  updateTransaction: (id, data) => withFallback(
    () => request(`/transactions/${id}`, { method: 'PUT', body: data }),
    () => storageAdapter.updateTransaction(id, data)
  ),
  deleteTransaction: (id) => withFallback(
    () => request(`/transactions/${id}`, { method: 'DELETE' }),
    () => storageAdapter.deleteTransaction(id)
  ),

  // 5. Budgets & Alerts (Ngân sách & Cảnh báo)
  getBudgets: (month) => withFallback(
    () => request('/budgets', { query: month ? { month } : undefined }),
    () => storageAdapter.getBudgets(month)
  ),
  getBudgetProgress: (month) => withFallback(
    () => request('/budgets/progress', { query: month ? { month } : undefined }),
    () => storageAdapter.getBudgetProgress(month)
  ),
  getAlerts: (month) => withFallback(
    () => request('/budgets/alerts', { query: month ? { month } : undefined }),
    () => storageAdapter.getAlerts(month)
  ),
  getBudgetById: (id) => withFallback(
    () => request(`/budgets/${id}`),
    () => storageAdapter.getBudgetById(id)
  ),
  setBudget: (data) => withFallback(
    () => request('/budgets', { method: 'POST', body: data }),
    () => storageAdapter.setBudget(data)
  ),
  deleteBudget: (id) => withFallback(
    () => request(`/budgets/${id}`, { method: 'DELETE' }),
    () => storageAdapter.deleteBudget(id)
  ),

  // 6. Analytics & Reports (Phân tích tài chính & KPI)
  getSummary: (month) => withFallback(
    () => request('/analytics/summary', { query: month ? { month } : undefined }),
    () => storageAdapter.getSummary(month)
  ),
  getOverview: (month) => withFallback(
    () => request('/analytics/overview', { query: month ? { month } : undefined }),
    () => storageAdapter.getOverview(month)
  ),
  getCategoryBreakdown: (month, type = 'expense') => withFallback(
    () => request('/analytics/category-breakdown', { query: { month, type } }),
    () => storageAdapter.getCategoryBreakdown(month, type)
  ),
  getTrends: (yearOrPeriod) => withFallback(
    () => {
      const isYear = typeof yearOrPeriod === 'string' && yearOrPeriod.length === 4;
      return request('/analytics/trends', { query: isYear ? { year: yearOrPeriod } : { period: yearOrPeriod } });
    },
    () => storageAdapter.getTrends(yearOrPeriod)
  ),
  getTopExpenses: (month, limit = 5) => withFallback(
    () => request('/analytics/top-expenses', { query: { month, limit } }),
    () => storageAdapter.getTopExpenses(month, limit)
  ),
  getFinancialTips: (month) => withFallback(
    () => request('/analytics/financial-tips', { query: month ? { month } : undefined }),
    () => storageAdapter.getFinancialTips(month)
  ),

  // 7. System Seed & Reset
  seedDatabase: () => withFallback(
    () => request('/system/seed', { method: 'POST' }),
    () => storageAdapter.seedDatabase()
  ),
  resetDatabase: () => withFallback(
    () => request('/system/reset', { method: 'POST' }),
    () => storageAdapter.resetDatabase()
  ),

  // 8. Authentication (Đăng ký, Đăng nhập, Hồ sơ)
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  getMe: () => request('/auth/me'),

  // 9. Admin Management (RBAC - Quản trị người dùng)
  adminGetUsers: () => request('/admin/users'),
  adminUpdateRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  adminGetStats: () => request('/admin/stats')
};

// Alias tương thích hoàn toàn cho getTrends
api.getFlowTrends = api.getTrends;

export default api;
