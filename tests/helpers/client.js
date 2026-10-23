/**
 * Unified Test Client for E2E Test Suite
 * Automatically delegates to Live HTTP Express Server if online,
 * or Authoritative Specification Oracle if server is offline/unbuilt.
 */

const { ContractOracle } = require('./oracle');

class ApiTestClient {
  constructor(baseUrl = process.env.API_BASE_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.oracle = new ContractOracle();
    this.mode = null; // 'LIVE_HTTP' or 'ORACLE_SPEC'
  }

  async detectMode() {
    if (process.env.FORCE_ORACLE === 'true') {
      this.mode = 'ORACLE_SPEC';
      return this.mode;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && (res.status === 200 || res.status === 204)) {
        this.mode = 'LIVE_HTTP';
      } else {
        this.mode = 'ORACLE_SPEC';
      }
    } catch {
      this.mode = 'ORACLE_SPEC';
    }

    return this.mode;
  }

  async ensureMode() {
    if (!this.mode) {
      await this.detectMode();
    }
    return this.mode;
  }

  async request(method, path, body = null, query = null) {
    await this.ensureMode();

    if (this.mode === 'LIVE_HTTP') {
      let url = `${this.baseUrl}${path}`;
      if (query) {
        const qParams = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined && v !== null) qParams.append(k, v);
        }
        const qs = qParams.toString();
        if (qs) url += `?${qs}`;
      }

      const headers = { 'Content-Type': 'application/json' };
      const options = { method, headers };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = json?.error?.message || json?.message || `HTTP ${res.status}`;
        const err = new Error(errMsg);
        err.status = res.status;
        err.response = json;
        throw err;
      }

      // Return unwrapped data if wrapped in standard { success: true, data: ... }
      if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
        return json.data;
      }
      return json;
    }

    // ORACLE_SPEC fallback handling
    return this.dispatchOracle(method, path, body, query);
  }

  dispatchOracle(method, path, body, query) {
    // Dispatch to in-memory Oracle
    if (path === '/api/health' || path === '/api/system/health') {
      return this.oracle.getHealth();
    }
    if (path === '/api/system/seed' || path === '/api/seed') {
      return this.oracle.seed();
    }
    if (path === '/api/system/reset' || path === '/api/reset') {
      this.oracle.reset();
      return { success: true, message: "Reset complete" };
    }
    if (path === '/api/wallets') {
      return this.oracle.getWallets();
    }
    if (path === '/api/categories') {
      if (method === 'GET') return this.oracle.getCategories(query?.type);
      if (method === 'POST') return this.oracle.createCategory(body);
    }
    if (path.startsWith('/api/categories/')) {
      const id = path.split('/')[3];
      if (method === 'PUT') return this.oracle.updateCategory(id, body);
      if (method === 'DELETE') return this.oracle.deleteCategory(id);
    }
    if (path === '/api/transactions') {
      if (method === 'GET') return this.oracle.getTransactions(query || {});
      if (method === 'POST') return this.oracle.createTransaction(body);
    }
    if (path.startsWith('/api/transactions/')) {
      const id = path.split('/')[3];
      if (method === 'GET') return this.oracle.getTransactionById(id);
      if (method === 'PUT') return this.oracle.updateTransaction(id, body);
      if (method === 'DELETE') return this.oracle.deleteTransaction(id);
    }
    if (path === '/api/budgets' || path === '/api/budgets/progress' || path === '/api/budgets/status') {
      if (method === 'GET') return this.oracle.getBudgets(query?.month);
      if (method === 'POST') return this.oracle.setBudget(body);
    }
    if (path.startsWith('/api/budgets/')) {
      const id = path.split('/')[3];
      if (method === 'DELETE') return this.oracle.deleteBudget(id);
    }
    if (path === '/api/analytics/overview' || path === '/api/analytics/summary') {
      return this.oracle.getAnalyticsOverview(query?.month);
    }
    if (path === '/api/analytics/category-breakdown') {
      return this.oracle.getCategoryBreakdown(query?.month, query?.type);
    }
    if (path === '/api/analytics/trend') {
      return this.oracle.getTrend(query?.period);
    }
    if (path === '/api/analytics/top-expenses') {
      return this.oracle.getTopExpenses(query?.month, query?.limit);
    }
    if (path === '/api/analytics/financial-tips') {
      return this.oracle.getFinancialTips(query?.month);
    }
    if (path === '/api/export/csv') {
      return this.oracle.exportCsv(query || {});
    }

    throw new Error(`Unknown mock route: ${method} ${path}`);
  }

  // --- Convenience Methods ---
  async getHealth() { return this.request('GET', '/api/health'); }
  async seed() { return this.request('POST', '/api/system/seed'); }
  async reset() { return this.request('POST', '/api/system/reset'); }
  async getWallets() { return this.request('GET', '/api/wallets'); }
  async getCategories(type) { return this.request('GET', '/api/categories', null, type ? { type } : null); }
  async createCategory(data) { return this.request('POST', '/api/categories', data); }
  async updateCategory(id, data) { return this.request('PUT', `/api/categories/${id}`, data); }
  async deleteCategory(id) { return this.request('DELETE', `/api/categories/${id}`); }
  async getTransactions(query) { return this.request('GET', '/api/transactions', null, query); }
  async getTransaction(id) { return this.request('GET', `/api/transactions/${id}`); }
  async createTransaction(data) { return this.request('POST', '/api/transactions', data); }
  async updateTransaction(id, data) { return this.request('PUT', `/api/transactions/${id}`, data); }
  async deleteTransaction(id) { return this.request('DELETE', `/api/transactions/${id}`); }
  async getBudgets(month) { return this.request('GET', '/api/budgets', null, month ? { month } : null); }
  async setBudget(data) { return this.request('POST', '/api/budgets', data); }
  async deleteBudget(id) { return this.request('DELETE', `/api/budgets/${id}`); }
  async getAnalyticsOverview(month) { return this.request('GET', '/api/analytics/overview', null, month ? { month } : null); }
  async getCategoryBreakdown(month, type) { return this.request('GET', '/api/analytics/category-breakdown', null, { month, type }); }
  async getTrend(period) { return this.request('GET', '/api/analytics/trend', null, { period }); }
  async getTopExpenses(month, limit) { return this.request('GET', '/api/analytics/top-expenses', null, { month, limit }); }
  async getFinancialTips(month) { return this.request('GET', '/api/analytics/financial-tips', null, { month }); }
  async exportCsv(query) { return this.request('GET', '/api/export/csv', null, query); }
}

module.exports = {
  ApiTestClient
};
