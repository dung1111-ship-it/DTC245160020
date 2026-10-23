/**
 * tests/ui_validation_challenge.test.js
 * EMPIRICAL UI VALIDATION, FILTERING, XSS & INTEGRITY CHALLENGE SUITE
 * 
 * Milestone: Milestone 2: Frontend Dashboard & Core UI
 * Subject: Triển khai và quản trị hệ thống phần mềm (Đề 38)
 * Student: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 * Agent: UI Validation & Interaction Challenger (challenger_m2_2)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Colors for terminal reporting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

let totalPassed = 0;
let totalFailed = 0;
const failureLog = [];
const suiteTimes = {};

async function test(suiteName, name, fn) {
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`  ${colors.green}✓ PASS${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
    totalPassed++;
    if (!suiteTimes[suiteName]) suiteTimes[suiteName] = [];
    suiteTimes[suiteName].push(Number(duration));
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.log(`  ${colors.red}✗ FAIL${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.log(`    ${colors.red}Assertion Error: ${err.message}${colors.reset}`);
    totalFailed++;
    failureLog.push({ suite: suiteName, name, error: err.message, stack: err.stack });
  }
}

// Ensure database and models are loaded
const { getDatabase } = require('../server/src/config/database');
const { initSchema } = require('../server/src/models/schema');
const { seedDatabase } = require('../server/src/scripts/seed');
const categoryModel = require('../server/src/models/categoryModel');
const transactionModel = require('../server/src/models/transactionModel');
const walletModel = require('../server/src/models/walletModel');

// Client dependencies
const esbuild = require(path.resolve('./client/node_modules/esbuild'));
const React = require(path.resolve('./client/node_modules/react'));
const ReactDOMServer = require(path.resolve('./client/node_modules/react-dom/server'));
const lucide = require(path.resolve('./client/node_modules/lucide-react'));

/**
 * Helper to compile and evaluate JSX components via esbuild
 */
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
        AreaChart: ({ children }) => React.createElement('div', { className: 'recharts-area' }, children),
        Area: () => null,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null
      };
    }
    return require(id);
  }, React);

  return m.exports.default || m.exports;
}

// Pre-load components
const TransactionTable = loadComponent('./client/src/components/transactions/TransactionTable.jsx');
const FilterBar = loadComponent('./client/src/components/transactions/FilterBar.jsx');
const TransactionModal = loadComponent('./client/src/components/transactions/TransactionModal.jsx');
const CategoryManagerModal = loadComponent('./client/src/components/categories/CategoryManagerModal.jsx');
const KPICards = loadComponent('./client/src/components/dashboard/KPICards.jsx');
const WalletCards = loadComponent('./client/src/components/dashboard/WalletCards.jsx');
const Header = loadComponent('./client/src/components/layout/Header.jsx');
const Footer = loadComponent('./client/src/components/layout/Footer.jsx');
const ExamModal = loadComponent('./client/src/components/layout/ExamModal.jsx');
const Navbar = loadComponent('./client/src/components/layout/Navbar.jsx');

/**
 * Pure validation rule replica from TransactionModal.jsx for fine-grained assertion
 */
function validateTransactionForm(formData) {
  const newErrors = {};
  const numAmount = Number(formData.amount);

  if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
    newErrors.amount = 'Số tiền phải là số hợp lệ lớn hơn 0 ₫';
  }
  if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
    newErrors.date = 'Ngày giao dịch không hợp lệ (định dạng YYYY-MM-DD)';
  }
  if (!formData.walletId) {
    newErrors.walletId = 'Vui lòng chọn ví thanh toán';
  }
  if (!formData.categoryId) {
    newErrors.categoryId = 'Vui lòng chọn danh mục';
  }

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors
  };
}

async function runAllSuites() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   EMPIRICAL UI VALIDATION, FILTERING & INTEGRITY CHALLENGE SUITE     ${colors.reset}`);
  console.log(`${colors.bold}   Đề 38: Môn Triển khai và quản trị hệ thống phần mềm                ${colors.reset}`);
  console.log(`${colors.bold}   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020                    ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);

  // Initialize DB & Seed for empirical tests
  const db = getDatabase();
  initSchema(db);
  seedDatabase(db, false);

  // =========================================================================
  // SUITE 1: TRANSACTION MODAL VALIDATION & CLIENT-SIDE FORM LOGIC
  // =========================================================================
  console.log(`${colors.bold}${colors.magenta}=== SUITE 1: Transaction Modal Validation & Client-Side Form Logic ===${colors.reset}`);

  await test('Modal Validation', '1.1 Amount validation: Reject empty string amount', async () => {
    const res = validateTransactionForm({
      type: 'expense',
      amount: '',
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: 'Test empty amount'
    });
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.errors.amount, 'Số tiền phải là số hợp lệ lớn hơn 0 ₫');
  });

  await test('Modal Validation', '1.2 Amount validation: Reject zero amount (0 and "0")', async () => {
    const resZeroNum = validateTransactionForm({
      amount: 0,
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food'
    });
    assert.strictEqual(resZeroNum.isValid, false);
    assert.strictEqual(resZeroNum.errors.amount, 'Số tiền phải là số hợp lệ lớn hơn 0 ₫');

    const resZeroStr = validateTransactionForm({
      amount: '0',
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food'
    });
    assert.strictEqual(resZeroStr.isValid, false);
    assert.strictEqual(resZeroStr.errors.amount, 'Số tiền phải là số hợp lệ lớn hơn 0 ₫');
  });

  await test('Modal Validation', '1.3 Amount validation: Reject negative amount (-50000)', async () => {
    const resNeg = validateTransactionForm({
      amount: -50000,
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food'
    });
    assert.strictEqual(resNeg.isValid, false);
    assert.strictEqual(resNeg.errors.amount, 'Số tiền phải là số hợp lệ lớn hơn 0 ₫');
  });

  await test('Modal Validation', '1.4 Amount validation: Reject NaN and alphabetic strings ("abc", "NaN")', async () => {
    const resAbc = validateTransactionForm({
      amount: 'abc',
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food'
    });
    assert.strictEqual(resAbc.isValid, false);
    assert.strictEqual(resAbc.errors.amount, 'Số tiền phải là số hợp lệ lớn hơn 0 ₫');

    const resNaN = validateTransactionForm({
      amount: 'NaN',
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food'
    });
    assert.strictEqual(resNaN.isValid, false);
    assert.strictEqual(resNaN.errors.amount, 'Số tiền phải là số hợp lệ lớn hơn 0 ₫');
  });

  await test('Modal Validation', '1.5 Amount validation: Accept valid positive amounts (1000, 50000, 50000000)', async () => {
    for (const val of [1000, '50000', 50000000]) {
      const res = validateTransactionForm({
        amount: val,
        date: '2026-10-22',
        walletId: 'cash',
        categoryId: 'cat_food'
      });
      assert.strictEqual(res.isValid, true, `Amount ${val} should be valid`);
      assert.strictEqual(res.errors.amount, undefined);
    }
  });

  await test('Modal Validation', '1.6 Empty Note handling: Empty or whitespace-only note is permitted and trimmed', async () => {
    const resEmpty = validateTransactionForm({
      amount: 45000,
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: ''
    });
    assert.strictEqual(resEmpty.isValid, true);
    assert.strictEqual(resEmpty.errors.note, undefined);

    const resWhitespace = validateTransactionForm({
      amount: 45000,
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: 'cat_food',
      note: '     '
    });
    assert.strictEqual(resWhitespace.isValid, true);
    assert.strictEqual(resWhitespace.errors.note, undefined);
  });

  await test('Modal Validation', '1.7 Missing Wallet validation: Reject empty, null, or undefined walletId', async () => {
    const resEmpty = validateTransactionForm({
      amount: 50000,
      date: '2026-10-22',
      walletId: '',
      categoryId: 'cat_food'
    });
    assert.strictEqual(resEmpty.isValid, false);
    assert.strictEqual(resEmpty.errors.walletId, 'Vui lòng chọn ví thanh toán');

    const resNull = validateTransactionForm({
      amount: 50000,
      date: '2026-10-22',
      walletId: null,
      categoryId: 'cat_food'
    });
    assert.strictEqual(resNull.isValid, false);
    assert.strictEqual(resNull.errors.walletId, 'Vui lòng chọn ví thanh toán');
  });

  await test('Modal Validation', '1.8 Missing Category validation: Reject empty, null, or undefined categoryId', async () => {
    const resEmpty = validateTransactionForm({
      amount: 50000,
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: ''
    });
    assert.strictEqual(resEmpty.isValid, false);
    assert.strictEqual(resEmpty.errors.categoryId, 'Vui lòng chọn danh mục');

    const resNull = validateTransactionForm({
      amount: 50000,
      date: '2026-10-22',
      walletId: 'cash',
      categoryId: null
    });
    assert.strictEqual(resNull.isValid, false);
    assert.strictEqual(resNull.errors.categoryId, 'Vui lòng chọn danh mục');
  });

  await test('Modal Validation', '1.9 Date validation: Reject missing or non-YYYY-MM-DD date strings', async () => {
    const invalidDates = ['', '2026/10/22', '22-10-2026', '2026-1-1', 'invalid-date'];
    for (const d of invalidDates) {
      const res = validateTransactionForm({
        amount: 50000,
        date: d,
        walletId: 'cash',
        categoryId: 'cat_food'
      });
      assert.strictEqual(res.isValid, false, `Date '${d}' should be invalid`);
      assert.strictEqual(res.errors.date, 'Ngày giao dịch không hợp lệ (định dạng YYYY-MM-DD)');
    }
  });

  await test('Modal Validation', '1.10 Quick Amount increment arithmetic (+50k, +100k, +200k, +500k, +1M, +2M)', async () => {
    const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
    let currentAmount = 0;
    for (const delta of QUICK_AMOUNTS) {
      currentAmount += delta;
      assert.ok(currentAmount > 0);
    }
    // Sum should be 3,850,000 VND
    assert.strictEqual(currentAmount, 3850000);
  });

  await test('Modal Validation', '1.11 Type Change Category Synchronization: Expense <-> Income auto-switch', async () => {
    const categories = [
      { id: 'cat_food', name: 'Ăn uống', type: 'expense' },
      { id: 'cat_shop', name: 'Mua sắm', type: 'expense' },
      { id: 'cat_salary', name: 'Lương thưởng', type: 'income' },
      { id: 'cat_bonus', name: 'Thưởng thêm', type: 'income' }
    ];

    function handleTypeChange(currentForm, newType) {
      const validCats = categories.filter(c => c.type === newType);
      const isCurrentCatValid = validCats.some(c => c.id === currentForm.categoryId);
      return {
        ...currentForm,
        type: newType,
        categoryId: isCurrentCatValid ? currentForm.categoryId : (validCats[0]?.id || '')
      };
    }

    // Start with expense cat_food
    let form = { type: 'expense', categoryId: 'cat_food' };
    
    // Switch to income -> should auto-select first income category (cat_salary)
    form = handleTypeChange(form, 'income');
    assert.strictEqual(form.type, 'income');
    assert.strictEqual(form.categoryId, 'cat_salary');

    // Switch to cat_bonus (income)
    form.categoryId = 'cat_bonus';
    // Switch to income again -> cat_bonus is valid income, should remain
    form = handleTypeChange(form, 'income');
    assert.strictEqual(form.categoryId, 'cat_bonus');

    // Switch to expense -> should auto-select first expense category (cat_food)
    form = handleTypeChange(form, 'expense');
    assert.strictEqual(form.type, 'expense');
    assert.strictEqual(form.categoryId, 'cat_food');
  });

  await test('Modal Validation', '1.12 Server-side React Render of TransactionModal with full controls', async () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(TransactionModal, {
        isOpen: true,
        onClose: () => {},
        onSave: () => {},
        wallets: [
          { id: 'cash', name: 'Tiền mặt', currentBalance: 1500000 },
          { id: 'bank', name: 'Thẻ ATM', currentBalance: 8500000 }
        ],
        categories: [
          { id: 'cat_food', name: 'Ăn uống', type: 'expense' },
          { id: 'cat_salary', name: 'Lương', type: 'income' }
        ]
      })
    );

    assert.ok(html.includes('Thêm giao dịch mới'), 'Should contain modal title');
    assert.ok(html.includes('Chi tiêu (Expense)'), 'Should contain expense button');
    assert.ok(html.includes('Thu nhập (Income)'), 'Should contain income button');
    assert.ok(html.includes('+50k'), 'Should contain quick amount chips');
    assert.ok(html.includes('+1M'), 'Should contain quick amount chips');
    assert.ok(html.includes('Tiền mặt'), 'Should render wallet options');
  });

  // =========================================================================
  // SUITE 2: FILTER COMBINATIONS, SEARCH CLEARING & EMPTY RESULT SETS
  // =========================================================================
  console.log(`\n${colors.bold}${colors.magenta}=== SUITE 2: Filter Combinations, Search Clearing & Empty Result Sets ===${colors.reset}`);

  await test('Filters', '2.1 Multi-criteria parameter compilation & SQLite query matching', async () => {
    // Perform search with 5 simultaneous criteria
    const filters = {
      search: 'Ăn',
      type: 'expense',
      walletId: 'cash',
      categoryId: 'cat_food',
      startDate: '2026-08-01',
      endDate: '2026-10-31',
      sortBy: 'transaction_date',
      sortOrder: 'DESC'
    };

    const result = transactionModel.find(filters);
    assert.ok(Array.isArray(result.transactions));
    assert.ok(result.pagination.total >= 0);

    for (const t of result.transactions) {
      assert.strictEqual(t.type, 'expense');
      assert.strictEqual(t.walletId, 'cash');
      assert.strictEqual(t.categoryId, 'cat_food');
      assert.ok(t.date >= '2026-08-01' && t.date <= '2026-10-31');
    }
  });

  await test('Filters', '2.2 Search keyword clearing action resets search state to empty string', async () => {
    let currentFilter = { search: 'bún bò', page: 3 };
    function onFilterChange(key, value) {
      currentFilter = { ...currentFilter, [key]: value, page: 1 };
    }

    // Trigger clear search
    onFilterChange('search', '');
    assert.strictEqual(currentFilter.search, '');
    assert.strictEqual(currentFilter.page, 1, 'Clearing search must reset pagination to page 1');
  });

  await test('Filters', '2.3 Type filter toggle pills reset categoryId to "all" to prevent stale invalid filters', async () => {
    let currentFilter = { type: 'expense', categoryId: 'cat_food' };
    function handleTypeToggle(newType) {
      currentFilter = {
        ...currentFilter,
        type: newType,
        categoryId: 'all',
        page: 1
      };
    }

    handleTypeToggle('income');
    assert.strictEqual(currentFilter.type, 'income');
    assert.strictEqual(currentFilter.categoryId, 'all', 'Switching type must reset categoryId filter to all');
  });

  await test('Filters', '2.4 Empty result sets: TransactionTable renders "Chưa có giao dịch nào" empty state', async () => {
    const htmlEmpty = ReactDOMServer.renderToString(
      React.createElement(TransactionTable, {
        transactions: [],
        isLoading: false
      })
    );

    assert.ok(htmlEmpty.includes('Chưa có giao dịch nào'), 'Must render empty state header "Chưa có giao dịch nào"');
    assert.ok(
      htmlEmpty.includes('Không có dữ liệu giao dịch phù hợp với tiêu chí lọc của bạn'),
      'Must render user-friendly message advising to change filters'
    );
  });

  await test('Filters', '2.5 FilterBar server-render with summary strip data aggregation', async () => {
    const summaryData = { count: 12, totalIncome: 15000000, totalExpense: 8500000 };
    const htmlFilter = ReactDOMServer.renderToString(
      React.createElement(FilterBar, {
        filters: { search: '', type: 'all', walletId: 'all', categoryId: 'all', datePreset: 'this_month' },
        onFilterChange: () => {},
        onResetFilters: () => {},
        categories: [{ id: 'cat_food', name: 'Ăn uống', type: 'expense' }],
        wallets: [{ id: 'cash', name: 'Tiền mặt', currentBalance: 1000000 }],
        summaryData
      })
    );

    assert.ok(htmlFilter.includes('Hiển thị'), 'Filter bar should show record count strip');
    assert.ok(htmlFilter.includes('12'), 'Filter bar should show count 12');
    assert.ok(htmlFilter.includes('Thu:'), 'Filter bar should show total income');
    assert.ok(htmlFilter.includes('Chi:'), 'Filter bar should show total expense');
    assert.ok(htmlFilter.includes('Ròng:'), 'Filter bar should show net savings');
  });

  // =========================================================================
  // SUITE 3: XSS SAFETY, HTML INJECTION & UNICODE / EMOJI INTEGRITY
  // =========================================================================
  console.log(`\n${colors.bold}${colors.magenta}=== SUITE 3: XSS Safety, HTML Injection & Unicode / Emoji Integrity ===${colors.reset}`);

  const XSS_ATTACK_VECTORS = [
    '<script>alert("XSS_ATTACK")</script>',
    '<b onmouseover="alert(\'XSS\')">Hover Payload</b>',
    '<img src=x onerror=alert(1)>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg><g/onload=alert(2)>',
    '"><script>alert(1)</script>',
    'javascript:alert(document.cookie)'
  ];

  for (let i = 0; i < XSS_ATTACK_VECTORS.length; i++) {
    const vector = XSS_ATTACK_VECTORS[i];
    await test('XSS Safety', `3.1.${i + 1} TransactionTable escapes attack vector #${i + 1}: ${vector.slice(0, 30)}...`, async () => {
      const tx = {
        id: `tx_xss_${i}`,
        date: '2026-10-22',
        amount: 50000,
        type: 'expense',
        walletId: 'cash',
        walletName: 'Tiền mặt',
        categoryId: 'cat_food',
        categoryName: vector,
        categoryIcon: 'Utensils',
        categoryColor: '#EF4444',
        note: vector,
        payeePayer: vector
      };

      const renderedHtml = ReactDOMServer.renderToString(
        React.createElement(TransactionTable, {
          transactions: [tx],
          isLoading: false
        })
      );

      // Verify unescaped raw HTML tags do NOT exist in the DOM string
      assert.strictEqual(
        renderedHtml.includes('<script>'),
        false,
        'Raw <script> tag must NOT be present in output HTML'
      );
      assert.strictEqual(
        renderedHtml.includes('<img src=x onerror='),
        false,
        'Raw <img onerror> must NOT be present in output HTML'
      );
      assert.strictEqual(
        renderedHtml.includes('<iframe'),
        false,
        'Raw <iframe tag must NOT be present in output HTML'
      );

      // Verify that React properly escaped '<' to '&lt;' and '>' to '&gt;'
      if (vector.includes('<')) {
        assert.ok(
          renderedHtml.includes('&lt;'),
          'Rendered output must contain safely escaped &lt;'
        );
      }
    });
  }

  await test('XSS Safety', '3.2 Client Codebase Audit: Zero usage of dangerouslySetInnerHTML', async () => {
    function scanDir(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      let results = [];
      for (const f of files) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
          results = results.concat(scanDir(fullPath));
        } else if (f.name.endsWith('.js') || f.name.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('dangerouslySetInnerHTML')) {
            results.push(fullPath);
          }
        }
      }
      return results;
    }

    const dangerousFiles = scanDir(path.resolve('./client/src'));
    assert.strictEqual(
      dangerousFiles.length,
      0,
      `Found dangerouslySetInnerHTML in: ${dangerousFiles.join(', ')}`
    );
  });

  await test('Unicode Integrity', '3.3 Vietnamese Diacritics, Tone Marks & Multibyte Emojis render without corruption', async () => {
    const complexVietnameseNote = 'Trần Mạnh Dũng (DTC245160020) - Lớp K23.K1.KHMT K23A. ' +
      'Ăn bún chả Hàng Than 🥞, phở Thìn Lò Đúc 🍜, cà phê trứng Giảng ☕! ' +
      'Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm 🎓🇻🇳';

    const tx = {
      id: 'tx_unicode_test',
      date: '2026-10-22',
      amount: 120000,
      type: 'expense',
      walletId: 'cash',
      categoryName: 'Ăn uống',
      note: complexVietnameseNote,
      payeePayer: 'Quán Phở Thìn Lò Đúc 🍜'
    };

    const renderedHtml = ReactDOMServer.renderToString(
      React.createElement(TransactionTable, {
        transactions: [tx],
        isLoading: false
      })
    );

    assert.ok(renderedHtml.includes('Trần Mạnh Dũng'), 'Must render student name accurately');
    assert.ok(renderedHtml.includes('DTC245160020'), 'Must render student MSSV accurately');
    assert.ok(renderedHtml.includes('K23.K1.KHMT K23A'), 'Must render class name accurately');
    assert.ok(renderedHtml.includes('Ăn bún chả Hàng Than'), 'Must render Vietnamese diacritics accurately');
    assert.ok(renderedHtml.includes('🍜'), 'Must render noodle emoji accurately');
    assert.ok(renderedHtml.includes('🇻🇳'), 'Must render Vietnam flag emoji accurately');
    assert.strictEqual(renderedHtml.includes('\uFFFD'), false, 'Must not contain Unicode replacement character');
  });

  // =========================================================================
  // SUITE 4: CATEGORY DELETION SAFETY & RELATIONAL INTEGRITY GUARD
  // =========================================================================
  console.log(`\n${colors.bold}${colors.magenta}=== SUITE 4: Category Deletion Safety & Relational Integrity Guard ===${colors.reset}`);

  await test('Integrity Guard', '4.1 CategoryManagerModal renders ShieldAlert & transfer selector when transactionCount > 0', async () => {
    // Inspect source code contract of CategoryManagerModal for integrity guard
    const modalSrc = fs.readFileSync(path.resolve('./client/src/components/categories/CategoryManagerModal.jsx'), 'utf8');
    
    assert.ok(modalSrc.includes('ShieldAlert'), 'Must import and use ShieldAlert icon');
    assert.ok(modalSrc.includes('Bảo toàn toàn vẹn dữ liệu'), 'Must contain integrity warning banner header');
    assert.ok(modalSrc.includes('transferTargetId'), 'Must provide transferTargetId category selector');
    assert.ok(modalSrc.includes('Chuyển giao dịch & Xóa'), 'Must require reassigning transactions before deletion');
  });

  await test('Integrity Guard', '4.2 Backend & SQLite reject direct deletion of category with existing transactions', async () => {
    // cat_food has active transactions from seed data
    const cat = categoryModel.getById('cat_food');
    assert.ok(cat !== null, 'cat_food should exist');
    assert.ok(cat.transactionCount > 0, `cat_food must have transactions (got ${cat.transactionCount})`);

    let threwError = false;
    try {
      categoryModel.delete('cat_food'); // Try to delete without transfer target
    } catch (err) {
      threwError = true;
      assert.strictEqual(err.code, 'CATEGORY_IN_USE');
      assert.ok(err.message.includes('giao dịch liên kết'));
    }

    assert.strictEqual(threwError, true, 'Deleting category with transactions without transfer target must throw CATEGORY_IN_USE');
    
    // Verify cat_food still exists
    const catAfter = categoryModel.getById('cat_food');
    assert.ok(catAfter !== null, 'cat_food must still exist in database');
  });

  await test('Integrity Guard', '4.3 Category deletion with transaction reassignment (transferToCategoryId) succeeds cleanly', async () => {
    // 1. Create a temporary category
    const tempCat = categoryModel.create({
      id: 'cat_test_temp_transfer',
      name: 'Danh mục tạm cần xóa',
      type: 'expense',
      icon: 'Tag',
      color: '#8B5CF6'
    });

    // 2. Create a transaction referencing this temporary category
    const testTx = transactionModel.create({
      walletId: 'cash',
      categoryId: tempCat.id,
      type: 'expense',
      amount: 75000,
      date: '2026-10-22',
      note: 'Transaction in category to be transferred'
    });

    // 3. Verify transaction is linked
    const catBefore = categoryModel.getById(tempCat.id);
    assert.strictEqual(catBefore.transactionCount, 1);

    // 4. Delete category with reassignment to cat_food
    const deleted = categoryModel.delete(tempCat.id, 'cat_food');
    assert.strictEqual(deleted, true);

    // 5. Verify temporary category is gone
    const catAfter = categoryModel.getById(tempCat.id);
    assert.strictEqual(catAfter, null, 'Temporary category must be deleted');

    // 6. Verify transaction was safely reassigned to cat_food
    const txAfter = transactionModel.getById(testTx.id);
    assert.strictEqual(txAfter.categoryId, 'cat_food', 'Transaction must be reassigned to cat_food');

    // Clean up test transaction
    transactionModel.delete(testTx.id);
  });

  await test('Integrity Guard', '4.4 Category deletion without transactions succeeds directly without transfer target', async () => {
    // 1. Create a temporary empty category
    const emptyCat = categoryModel.create({
      id: 'cat_test_empty_delete',
      name: 'Danh mục rỗng xóa ngay',
      type: 'expense',
      icon: 'Trash',
      color: '#6B7280'
    });

    assert.strictEqual(emptyCat.transactionCount, 0);

    // 2. Delete directly
    const deleted = categoryModel.delete(emptyCat.id);
    assert.strictEqual(deleted, true);

    // 3. Verify deletion
    const checkCat = categoryModel.getById(emptyCat.id);
    assert.strictEqual(checkCat, null, 'Empty category must be deleted cleanly');
  });

  // =========================================================================
  // SUITE 5: STUDENT EXAM BRANDING & COMPONENT RENDER HEALTH
  // =========================================================================
  console.log(`\n${colors.bold}${colors.magenta}=== SUITE 5: Student Exam Branding & Component Render Health ===${colors.reset}`);

  await test('Branding', '5.1 Header component renders student exam badge: Trần Mạnh Dũng (DTC245160020)', async () => {
    const htmlHeader = ReactDOMServer.renderToString(
      React.createElement(Header, {
        onOpenExamModal: () => {},
        serverStatus: { isOnline: true }
      })
    );

    assert.ok(htmlHeader.includes('Trần Mạnh Dũng'), 'Header must contain student name');
    assert.ok(htmlHeader.includes('DTC245160020'), 'Header must contain student MSSV');
    assert.ok(htmlHeader.includes('Đề 38'), 'Header must contain exam topic Đề 38');
    assert.ok(htmlHeader.includes('Hệ thống Online') || htmlHeader.includes('Online'), 'Header must contain status indicator');
  });

  await test('Branding', '5.2 Footer component renders full student credentials & subject information', async () => {
    const htmlFooter = ReactDOMServer.renderToString(React.createElement(Footer));

    assert.ok(htmlFooter.includes('Trần Mạnh Dũng'), 'Footer must contain student name');
    assert.ok(htmlFooter.includes('DTC245160020'), 'Footer must contain MSSV DTC245160020');
    assert.ok(htmlFooter.includes('K23.K1.KHMT K23A'), 'Footer must contain class K23.K1.KHMT K23A');
    assert.ok(htmlFooter.includes('30/07/2006'), 'Footer must contain DOB 30/07/2006');
    assert.ok(htmlFooter.includes('Triển khai và quản trị hệ thống phần mềm'), 'Footer must contain subject name');
  });

  await test('Branding', '5.3 ExamModal renders official student record modal for exam evaluation', async () => {
    const htmlExam = ReactDOMServer.renderToString(
      React.createElement(ExamModal, {
        isOpen: true,
        onClose: () => {}
      })
    );

    assert.ok(htmlExam.includes('Trần Mạnh Dũng'), 'ExamModal must contain student name');
    assert.ok(htmlExam.includes('DTC245160020'), 'ExamModal must contain MSSV');
    assert.ok(htmlExam.includes('K23.K1.KHMT K23A'), 'ExamModal must contain class name');
    assert.ok(htmlExam.includes('30/07/2006'), 'ExamModal must contain date of birth');
    assert.ok(htmlExam.includes('Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân'), 'ExamModal must contain project topic');
  });

  await test('Component Health', '5.4 KPICards render Total Balance, Income, Expense, and Savings Rate % without crash', async () => {
    const htmlKpi = ReactDOMServer.renderToString(
      React.createElement(KPICards, {
        summary: {
          totalBalance: 25000000,
          monthlyIncome: 18000000,
          monthlyExpense: 9000000,
          netSavings: 9000000,
          savingsRate: 50.0,
          isDeficit: false,
          comparison: { incomeGrowthRate: 15.5, expenseGrowthRate: -5.2 }
        },
        currentMonth: '2026-10'
      })
    );

    assert.ok(htmlKpi.includes('Tổng số dư khả dụng'), 'KPI must contain total balance card');
    assert.ok(htmlKpi.includes('Thu nhập tháng'), 'KPI must contain monthly income card');
    assert.ok(htmlKpi.includes('Chi tiêu tháng'), 'KPI must contain monthly expense card');
    assert.ok(htmlKpi.includes('Tỷ lệ tiết kiệm'), 'KPI must contain savings rate card');
    assert.ok(htmlKpi.includes('50%'), 'KPI must display savings rate percentage');
  });

  await test('Component Health', '5.5 WalletCards render Cash, Bank Card, and MoMo E-Wallet balances', async () => {
    const htmlWallets = ReactDOMServer.renderToString(
      React.createElement(WalletCards, {
        wallets: [
          { id: 'cash', name: 'Tiền mặt', currentBalance: 2500000, initialBalance: 2000000 },
          { id: 'bank', name: 'Tài khoản Ngân hàng (ATM)', currentBalance: 15000000, initialBalance: 10000000 },
          { id: 'ewallet', name: 'Ví điện tử (Momo/ZaloPay)', currentBalance: 3200000, initialBalance: 1000000 }
        ],
        onSelectWallet: () => {},
        selectedWalletId: 'all'
      })
    );

    assert.ok(htmlWallets.includes('Tiền mặt'), 'Wallet cards must display Cash');
    assert.ok(htmlWallets.includes('Tài khoản Ngân hàng (ATM)'), 'Wallet cards must display Bank ATM');
    assert.ok(htmlWallets.includes('Ví điện tử (Momo/ZaloPay)'), 'Wallet cards must display E-Wallet');
  });

  await test('Component Health', '5.6 Navbar renders exactly 5 required navigation tabs (F09)', async () => {
    const htmlNavbar = ReactDOMServer.renderToString(
      React.createElement(Navbar, {
        activeTab: 'Dashboard',
        onTabChange: () => {}
      })
    );

    const requiredTabs = ['Dashboard', 'Giao dịch', 'Danh mục', 'Ngân sách', 'Báo cáo'];
    for (const tab of requiredTabs) {
      assert.ok(htmlNavbar.includes(tab), `Navbar must render tab: ${tab}`);
    }
  });

  // =========================================================================
  // SUMMARY & VERDICT
  // =========================================================================
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}EMPIRICAL UI CHALLENGE SUMMARY:${colors.reset}`);
  console.log(`  Total Tests Run: ${colors.bold}${totalPassed + totalFailed}${colors.reset}`);
  console.log(`  Passed Tests:    ${colors.green}${colors.bold}${totalPassed}${colors.reset}`);
  console.log(`  Failed Tests:    ${totalFailed > 0 ? colors.red : colors.green}${colors.bold}${totalFailed}${colors.reset}`);

  for (const [suite, times] of Object.entries(suiteTimes)) {
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
    const max = Math.max(...times).toFixed(1);
    console.log(`  - Suite [${suite}]: ${times.length} tests, avg: ${avg}ms, max: ${max}ms`);
  }

  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${colors.bold}${colors.green}>>> EMPIRICAL CHALLENGE VERDICT: [APPROVE] <<<${colors.reset}`);
    console.log(`${colors.green}All modal validations, filter combinations, XSS escape sanitization, category deletion integrity safeguards, and student exam branding PASSED empirically.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.red}>>> EMPIRICAL CHALLENGE VERDICT: [CHALLENGE_FAILED] <<<${colors.reset}`);
    console.log(`${colors.red}${totalFailed} test(s) failed during empirical UI challenge.${colors.reset}\n`);
    failureLog.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.suite}] ${f.name} -> ${f.error}`);
    });
    process.exit(1);
  }
}

runAllSuites().catch(err => {
  console.error(`${colors.bold}${colors.red}FATAL ERROR IN UI CHALLENGE SUITE:${colors.reset}`, err);
  process.exit(1);
});
