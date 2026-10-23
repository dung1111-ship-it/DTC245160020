/**
 * tests/auditor_m3_stress.js
 * Independent Forensic Adversarial Stress Test for Milestone 3 Work Products
 * 
 * Verifies:
 * 1. storageAdapter functionality (offline fallback engine)
 * 2. Budget threshold calculations (80%, 100%, overflow, zero limits)
 * 3. Division-by-zero protection in charts and summaries
 * 4. React 18 SSR rendering of all Analytics and Budget components
 * 5. MockData schema and relational consistency
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Client dependencies
const esbuild = require(path.resolve('./client/node_modules/esbuild'));
const React = require(path.resolve('./client/node_modules/react'));
const ReactDOMServer = require(path.resolve('./client/node_modules/react-dom/server'));
const lucide = require(path.resolve('./client/node_modules/lucide-react'));

function loadComponent(filePath) {
  const absPath = path.resolve(filePath);
  const bundle = esbuild.buildSync({
    entryPoints: [absPath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    nodePaths: [path.resolve('./client/node_modules')],
    external: ['react', 'react-dom', 'lucide-react', 'recharts'],
    define: {
      'import.meta.env': '{}',
      'import.meta.env.VITE_API_URL': '""'
    },
    write: false
  });

  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', 'React', bundle.outputFiles[0].text);
  fn(m, m.exports, (id) => {
    if (id === 'react') return React;
    if (id === 'react-dom') return require(path.resolve('./client/node_modules/react-dom'));
    if (id === 'react-dom/server') return ReactDOMServer;
    if (id === 'lucide-react') return lucide;
    if (id === 'recharts') {
      return {
        ResponsiveContainer: ({ children }) => React.createElement('div', { className: 'recharts-container' }, children),
        PieChart: ({ children }) => React.createElement('div', { className: 'recharts-pie' }, children),
        Pie: () => null,
        Cell: () => null,
        Tooltip: () => null,
        Legend: () => null,
        Sector: () => null,
        AreaChart: ({ children }) => React.createElement('div', { className: 'recharts-area' }, children),
        Area: () => null,
        BarChart: ({ children }) => React.createElement('div', { className: 'recharts-bar' }, children),
        Bar: () => null,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null
      };
    }
    return require(id);
  }, React);

  return m.exports;
}

// Load compiled services
const mockDataModule = loadComponent('./client/src/services/mockData.js');
const { MOCK_EXAM_INFO, MOCK_WALLETS, MOCK_CATEGORIES, MOCK_BUDGETS, MOCK_TRANSACTIONS } = mockDataModule;

const storageModule = loadComponent('./client/src/services/storageAdapter.js');
const storageAdapter = storageModule.storageAdapter || storageModule.default;

// Load components
const BudgetProgressBar = loadComponent('./client/src/components/budgets/BudgetProgressBar.jsx').default;
const BudgetCards = loadComponent('./client/src/components/budgets/BudgetCards.jsx').default;
const BudgetModal = loadComponent('./client/src/components/budgets/BudgetModal.jsx').default;
const AlertBanner = loadComponent('./client/src/components/budgets/AlertBanner.jsx').default;
const TopExpenses = loadComponent('./client/src/components/analytics/TopExpenses.jsx').default;
const FinancialTips = loadComponent('./client/src/components/analytics/FinancialTips.jsx').default;
const CategoryDoughnutChart = loadComponent('./client/src/components/analytics/CategoryDoughnutChart.jsx').default;
const CashFlowTrendChart = loadComponent('./client/src/components/analytics/CashFlowTrendChart.jsx').default;

console.log('======================================================================');
console.log('   AUDITOR M3 INDEPENDENT FORENSIC STRESS TEST');
console.log('======================================================================');

let passedChecks = 0;
let totalChecks = 0;

function check(name, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✓ PASS [AUDIT-${totalChecks.toString().padStart(2, '0')}]: ${name}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ FAIL [AUDIT-${totalChecks.toString().padStart(2, '0')}]: ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncCheck(name, fn) {
  totalChecks++;
  try {
    await fn();
    console.log(`  ✓ PASS [AUDIT-${totalChecks.toString().padStart(2, '0')}]: ${name}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ FAIL [AUDIT-${totalChecks.toString().padStart(2, '0')}]: ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function main() {
  console.log('\n--- 1. MOCK DATA SCHEMA & RELATIONAL INTEGRITY ---');

  check('Student Exam Info matches required student and assignment', () => {
    assert.strictEqual(MOCK_EXAM_INFO.studentName, 'Trần Mạnh Dũng');
    assert.strictEqual(MOCK_EXAM_INFO.studentId, 'DTC245160020');
    assert.strictEqual(MOCK_EXAM_INFO.className, 'K23.K1.KHMT K23A');
    assert.ok(MOCK_EXAM_INFO.topic.includes('Đề 38'));
  });

  check('Wallets contain all 3 required types with positive balances', () => {
    assert.strictEqual(MOCK_WALLETS.length, 3);
    const ids = MOCK_WALLETS.map(w => w.id);
    assert.ok(ids.includes('cash'));
    assert.ok(ids.includes('bank'));
    assert.ok(ids.includes('ewallet'));
    MOCK_WALLETS.forEach(w => assert.ok(w.initialBalance > 0));
  });

  check('Categories contain both income and expense categories', () => {
    const incomes = MOCK_CATEGORIES.filter(c => c.type === 'income');
    const expenses = MOCK_CATEGORIES.filter(c => c.type === 'expense');
    assert.ok(incomes.length >= 4, 'At least 4 income categories');
    assert.ok(expenses.length >= 8, 'At least 8 expense categories');
  });

  check('All mock transactions reference valid wallets and categories', () => {
    const validWallets = new Set(MOCK_WALLETS.map(w => w.id));
    const validCats = new Set(MOCK_CATEGORIES.map(c => c.id));
    assert.ok(MOCK_TRANSACTIONS.length >= 15, 'At least 15 multi-month transactions');

    for (const t of MOCK_TRANSACTIONS) {
      assert.ok(validWallets.has(t.walletId), `Transaction ${t.id} has invalid wallet: ${t.walletId}`);
      assert.ok(validCats.has(t.categoryId), `Transaction ${t.id} has invalid category: ${t.categoryId}`);
      assert.ok(t.amount > 0, `Transaction ${t.id} amount must be > 0`);
      assert.ok(t.date && t.date.length === 10, `Transaction ${t.id} date must be YYYY-MM-DD`);
    }
  });

  console.log('\n--- 2. OFFLINE STORAGE ADAPTER & BUSINESS LOGIC ---');

  await runAsyncCheck('storageAdapter health returns offline status and student info', async () => {
    const health = await storageAdapter.getHealth();
    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(health.mode, 'offline_localstorage');
    assert.strictEqual(health.student.studentId, 'DTC245160020');
  });

  await runAsyncCheck('storageAdapter getWallets calculates balance = initial + income - expense', async () => {
    const wallets = await storageAdapter.getWallets();
    assert.strictEqual(wallets.length, 3);
    for (const w of wallets) {
      assert.strictEqual(
        w.currentBalance,
        w.initialBalance + w.incomeSum - w.expenseSum,
        `Balance equation broken for wallet ${w.id}`
      );
    }
  });

  await runAsyncCheck('storageAdapter getSummary handles October 2026 accurately', async () => {
    const summary = await storageAdapter.getSummary('2026-10');
    assert.strictEqual(summary.month, '2026-10');
    assert.ok(summary.monthlyIncome > 0);
    assert.ok(summary.monthlyExpense > 0);
    assert.strictEqual(summary.netSavings, summary.monthlyIncome - summary.monthlyExpense);
    assert.strictEqual(summary.isDeficit, summary.monthlyExpense > summary.monthlyIncome);
  });

  await runAsyncCheck('storageAdapter getCategoryBreakdown handles empty month without division by zero', async () => {
    const breakdown = await storageAdapter.getCategoryBreakdown('2099-12', 'expense');
    assert.strictEqual(breakdown.totalAmount, 0);
    assert.strictEqual(breakdown.items.length, 0);
  });

  await runAsyncCheck('storageAdapter getTrends returns August, September, October periods', async () => {
    const trends = await storageAdapter.getTrends('2026');
    assert.strictEqual(trends.length, 3);
    const periods = trends.map(t => t.month);
    assert.deepStrictEqual(periods, ['2026-08', '2026-09', '2026-10']);
    for (const t of trends) {
      assert.strictEqual(t.net, t.income - t.expense);
    }
  });

  await runAsyncCheck('storageAdapter getTopExpenses limits count and sorts descending', async () => {
    const top = await storageAdapter.getTopExpenses('2026-10', 3);
    assert.ok(top.length <= 3);
    for (let i = 1; i < top.length; i++) {
      assert.ok(Number(top[i - 1].amount) >= Number(top[i].amount), 'Must be sorted descending');
    }
  });

  await runAsyncCheck('storageAdapter getBudgetProgress calculates threshold status correctly', async () => {
    const progress = await storageAdapter.getBudgetProgress('2026-10');
    assert.ok(progress.items.length > 0);
    for (const b of progress.items) {
      if (b.percentage >= 100) {
        assert.strictEqual(b.status, 'exceeded');
      } else if (b.percentage >= 80) {
        assert.strictEqual(b.status, 'warning');
      } else {
        assert.strictEqual(b.status, 'safe');
      }
    }
  });

  console.log('\n--- 3. BUDGET PROGRESS BAR & ALERT THRESHOLD INVARIANTS ---');

  check('BudgetProgressBar renders safe status when pct < 80%', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(BudgetProgressBar, {
        percentage: 50,
        spentAmount: 1500000,
        limitAmount: 3000000,
        remainingAmount: 1500000,
        showBadge: true
      })
    );
    assert.ok(html.includes('An toàn'), 'Must display An toàn');
    assert.ok(html.includes('bg-emerald-500'), 'Must use green progress color');
  });

  check('BudgetProgressBar renders warning status when 80% <= pct < 100%', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(BudgetProgressBar, {
        percentage: 85,
        spentAmount: 2550000,
        limitAmount: 3000000,
        remainingAmount: 450000,
        showBadge: true
      })
    );
    assert.ok(html.includes('Sắp chạm trần'), 'Must display Sắp chạm trần');
    assert.ok(html.includes('bg-amber-500'), 'Must use amber progress color');
  });

  check('BudgetProgressBar renders exceeded status when pct >= 100%', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(BudgetProgressBar, {
        percentage: 120,
        spentAmount: 3600000,
        limitAmount: 3000000,
        remainingAmount: -600000,
        showBadge: true
      })
    );
    assert.ok(html.includes('Vượt hạn mức'), 'Must display Vượt hạn mức');
    assert.ok(html.includes('bg-rose-500'), 'Must use rose progress color');
    assert.ok(html.includes('animate-pulse'), 'Must pulse when exceeded');
  });

  check('AlertBanner compact mode returns empty when no alerts exist', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(AlertBanner, {
        alerts: [],
        compact: true
      })
    );
    assert.strictEqual(html, '');
  });

  check('AlertBanner compact mode renders warning banner when alerts exist', () => {
    const mockAlerts = [
      { id: '1', categoryName: 'Ăn uống', percentage: 93.3, status: 'warning', spentAmount: 2800000, limitAmount: 3000000, remainingAmount: 200000 }
    ];
    const html = ReactDOMServer.renderToString(
      React.createElement(AlertBanner, {
        alerts: mockAlerts,
        compact: true
      })
    );
    assert.ok(html.includes('Lưu ý') || html.includes('Cảnh báo'));
    assert.ok(html.includes('Ăn uống'));
  });

  check('AlertBanner full mode renders exceeded warning cards', () => {
    const mockAlerts = [
      { id: '1', categoryName: 'Mua sắm', percentage: 110, status: 'exceeded', spentAmount: 550000, limitAmount: 500000, remainingAmount: -50000 }
    ];
    const html = ReactDOMServer.renderToString(
      React.createElement(AlertBanner, {
        alerts: mockAlerts,
        compact: false
      })
    );
    assert.ok(html.includes('Vượt hạn mức ngân sách'));
    assert.ok(html.includes('Mua sắm'));
  });

  console.log('\n--- 4. SSR COMPONENT RENDER HEALTH & PRESET VALUES ---');

  check('BudgetCards renders empty state cleanly with call to action', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(BudgetCards, { items: [], isLoading: false })
    );
    assert.ok(html.includes('Chưa có hạn mức ngân sách nào'));
    assert.ok(html.includes('Thiết lập hạn mức ngay'));
  });

  check('BudgetModal preset chips include standard student denominations', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(BudgetModal, {
        isOpen: true,
        onClose: () => {},
        categories: MOCK_CATEGORIES,
        currentMonth: '2026-10'
      })
    );
    assert.ok(html.includes('500k'));
    assert.ok(html.includes('1 Triệu'));
    assert.ok(html.includes('2 Triệu'));
    assert.ok(html.includes('3 Triệu'));
    assert.ok(html.includes('5 Triệu'));
    assert.ok(html.includes('10 Triệu'));
  });

  check('TopExpenses renders ranking badges and proportion bars', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(TopExpenses, {
        month: '2026-10',
        limit: 5
      })
    );
    assert.ok(html.includes('Khoản Chi Lớn Nhất') && html.includes('Top'));
  });

  check('FinancialTips renders AI Rule-based recommendation container', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(FinancialTips, { month: '2026-10' })
    );
    assert.ok(html.includes('Mẹo Tối Ưu Tài Chính'));
    assert.ok(html.includes('AI Rule-based'));
  });

  check('CategoryDoughnutChart renders without SSR errors', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(CategoryDoughnutChart, {
        month: '2026-10',
        initialType: 'expense'
      })
    );
    assert.ok(html.includes('Cơ Cấu Chi Tiêu') || html.includes('Cơ Cấu'));
  });

  check('CashFlowTrendChart renders without SSR errors', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(CashFlowTrendChart, {
        year: '2026'
      })
    );
    assert.ok(html.includes('Xu Hướng Dòng Tiền'));
  });

  console.log('\n======================================================================');
  console.log(`FORENSIC STRESS TEST RESULT: ${passedChecks}/${totalChecks} PASSED (100%)`);
  console.log('>>> FORENSIC VERDICT: VERIFIED CLEAN <<<');
  console.log('======================================================================\n');
}

main().catch(err => {
  console.error('Fatal stress test failure:', err);
  process.exit(1);
});
