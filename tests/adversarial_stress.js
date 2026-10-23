/**
 * tests/adversarial_stress.js
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS FOR MILESTONE 1 BACKEND
 *
 * Subject: Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Student: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 * Agent: Empirical Challenger (challenger_m1_1)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// ANSI terminal colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
  bgRed: '\x1b[41m'
};

let totalPassed = 0;
let totalFailed = 0;
const failureLog = [];
const timingStats = {};

async function executeTest(suiteName, testName, testFn) {
  const start = performance.now();
  process.stdout.write(`  ${c.gray}RUN${c.reset}  ${testName} ... `);
  try {
    await testFn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`\r  ${c.green}✓ PASS${c.reset} ${testName} ${c.gray}(${duration}ms)${c.reset}`);
    totalPassed++;
    if (!timingStats[suiteName]) timingStats[suiteName] = [];
    timingStats[suiteName].push(Number(duration));
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.log(`\r  ${c.red}✗ FAIL${c.reset} ${testName} ${c.gray}(${duration}ms)${c.reset}`);
    console.log(`    ${c.red}Assertion Error: ${err.message}${c.reset}`);
    totalFailed++;
    failureLog.push({ suite: suiteName, name: testName, error: err.message, stack: err.stack });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Value mismatch'} - Expected: [${expected}], Got: [${actual}]`);
  }
}

function assertErrorEnvelope(resStatus, resBody, expectedErrorCode = null) {
  assert(resStatus >= 400 && resStatus < 600, `Expected HTTP 4xx or 5xx error status, got ${resStatus}`);
  assert(resBody && typeof resBody === 'object', 'Response body must be JSON object');
  assertEqual(resBody.success, false, 'Error envelope must have success: false');
  assert(resBody.error && typeof resBody.error === 'object', 'Error envelope must have error object');
  assert(typeof resBody.error.code === 'string' && resBody.error.code.length > 0, 'Error code must be non-empty string');
  assert(typeof resBody.error.message === 'string' && resBody.error.message.length > 0, 'Error message must be non-empty string');
  if (expectedErrorCode) {
    assertEqual(resBody.error.code, expectedErrorCode, `Error code must be ${expectedErrorCode}`);
  }
}

async function rawRequest(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const reqHeaders = { ...headers };
  let reqBody = body;

  if (body !== null && typeof body === 'object' && !(body instanceof Buffer)) {
    if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/json';
    reqBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: reqBody
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  return {
    status: response.status,
    headers: response.headers,
    data
  };
}

// -------------------------------------------------------------
// MAIN ADVERSARIAL STRESS TEST SUITE
// -------------------------------------------------------------
async function runAdversarialStressSuite() {
  console.log(`\n${c.bold}${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}   EMPIRICAL ADVERSARIAL STRESS TEST HARNESS                          ${c.reset}`);
  console.log(`${c.bold}   Đề 38: Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính     ${c.reset}`);
  console.log(`${c.bold}   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020                     ${c.reset}`);
  console.log(`${c.bold}   Target API: ${BASE_URL}${c.reset}`);
  console.log(`${c.bold}${c.cyan}======================================================================${c.reset}\n`);

  // Initial Health Check
  const health = await rawRequest('GET', '/api/health');
  assert(health.status === 200, `Initial health check failed with status ${health.status}`);
  assert(health.data.success === true, 'Health check envelope invalid');
  console.log(`  ${c.green}● System status: HEALTHY (SQLite connected at: ${health.data.data.database.path})${c.reset}\n`);

  // =========================================================================
  // SUITE 1: RAPID CONCURRENT BURSTS & SQLITE WAL LOCK RESILIENCE
  // =========================================================================
  console.log(`${c.bold}${c.magenta}=== SUITE 1: Rapid Concurrent Bursts & SQLite WAL Lock Resilience ===${c.reset}`);

  // Fetch initial wallet balances
  const initialWalletsRes = await rawRequest('GET', '/api/wallets');
  assert(initialWalletsRes.status === 200, 'Could not fetch wallets');
  const cashWalletInitial = initialWalletsRes.data.data.find(w => w.id === 'cash');
  const initialCashBalance = cashWalletInitial.currentBalance;

  const CONCURRENT_COUNT = 120;
  const createdTxIds = [];
  const singleTxAmount = 10000;

  await executeTest('Concurrency', `Burst 1: ${CONCURRENT_COUNT} parallel concurrent POST transactions (Write Pressure)`, async () => {
    const promises = [];
    for (let i = 0; i < CONCURRENT_COUNT; i++) {
      const payload = {
        walletId: 'cash',
        categoryId: 'cat_food',
        type: 'expense',
        amount: singleTxAmount,
        date: '2026-10-22',
        note: `Adversarial Concurrency Stress #${i} - Sinh viên Trần Mạnh Dũng DTC245160020`,
        payeePayer: `StressWorker_${i}`
      };
      promises.push(rawRequest('POST', '/api/transactions', payload));
    }

    const results = await Promise.all(promises);

    let successCount = 0;
    for (const r of results) {
      if (r.status === 201 && r.data?.success === true && r.data?.data?.id) {
        successCount++;
        createdTxIds.push(r.data.data.id);
      } else {
        // If it failed, check if it was SQLITE_BUSY
        const errMsg = JSON.stringify(r.data);
        assert(!errMsg.includes('SQLITE_BUSY'), `SQLITE_BUSY encountered! Concurrency lock failed: ${errMsg}`);
        assert(false, `Transaction creation failed with status ${r.status}: ${errMsg}`);
      }
    }

    assertEqual(successCount, CONCURRENT_COUNT, `All ${CONCURRENT_COUNT} concurrent transactions must succeed without failure`);
  });

  await executeTest('Concurrency', 'Verify Wallet Balance Invariant after concurrent write burst', async () => {
    const walletsRes = await rawRequest('GET', '/api/wallets');
    assertEqual(walletsRes.status, 200);
    const cashWallet = walletsRes.data.data.find(w => w.id === 'cash');
    const expectedBalance = initialCashBalance - (CONCURRENT_COUNT * singleTxAmount);
    assertEqual(cashWallet.currentBalance, expectedBalance, 'Dynamic cash balance must match exact mathematical sum');
  });

  await executeTest('Concurrency', 'Burst 2: Concurrent Interleaved Read-Write Swarm (50 requests simultaneously)', async () => {
    // 25 reads while 25 writes/reads occur simultaneously
    const swarmPromises = [];

    // 15 reads to /api/wallets
    for (let i = 0; i < 15; i++) {
      swarmPromises.push(rawRequest('GET', '/api/wallets'));
    }
    // 10 reads to /api/analytics/summary
    for (let i = 0; i < 10; i++) {
      swarmPromises.push(rawRequest('GET', '/api/analytics/summary?month=2026-10'));
    }
    // 10 reads to /api/budgets/progress
    for (let i = 0; i < 10; i++) {
      swarmPromises.push(rawRequest('GET', '/api/budgets/progress?month=2026-10'));
    }
    // 15 writes of new income transactions
    for (let i = 0; i < 15; i++) {
      swarmPromises.push(rawRequest('POST', '/api/transactions', {
        walletId: 'cash',
        categoryId: 'cat_salary',
        type: 'income',
        amount: 20000,
        date: '2026-10-22',
        note: `Interleaved Read-Write Swarm #${i}`
      }));
    }

    const swarmResults = await Promise.all(swarmPromises);

    for (let idx = 0; idx < swarmResults.length; idx++) {
      const res = swarmResults[idx];
      assert(!JSON.stringify(res.data).includes('SQLITE_BUSY'), `SQLITE_BUSY found in swarm request #${idx}`);
      assert([200, 201].includes(res.status), `Unexpected HTTP status in swarm request #${idx}: ${res.status}`);
      if (res.status === 201 && res.data?.data?.id) {
        createdTxIds.push(res.data.data.id);
      }
    }
  });

  await executeTest('Concurrency', `Burst 3: Rapid Concurrent Parallel DELETEs (${createdTxIds.length} items)`, async () => {
    const deletePromises = createdTxIds.map(id => rawRequest('DELETE', `/api/transactions/${id}`));
    const deleteResults = await Promise.all(deletePromises);

    for (let i = 0; i < deleteResults.length; i++) {
      const r = deleteResults[i];
      assertEqual(r.status, 200, `Concurrent DELETE on tx ${createdTxIds[i]} failed with status ${r.status}`);
      assertEqual(r.data.success, true, 'Delete success flag must be true');
    }
  });

  await executeTest('Concurrency', 'Verify Wallet Balance Clean Restoration after all bursts deleted', async () => {
    const walletsRes = await rawRequest('GET', '/api/wallets');
    assertEqual(walletsRes.status, 200);
    const cashWallet = walletsRes.data.data.find(w => w.id === 'cash');
    assertEqual(cashWallet.currentBalance, initialCashBalance, 'Wallet balance must be fully restored to pre-burst level');
  });

  // =========================================================================
  // SUITE 2: BOUNDARY STRESS & MATHEMATICAL EDGE CASES
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}=== SUITE 2: Boundary Stress & Mathematical Edge Cases ===${c.reset}`);

  await executeTest('Boundaries', 'Reject amount = 0 on POST /api/transactions', async () => {
    const res = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 0,
      date: '2026-10-22'
    });
    assertErrorEnvelope(res.status, res.data, 'VALIDATION_ERROR');
    assertEqual(res.status, 400);
  });

  await executeTest('Boundaries', 'Reject negative amount (-500,000) on POST /api/transactions', async () => {
    const res = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: -500000,
      date: '2026-10-22'
    });
    assertErrorEnvelope(res.status, res.data, 'VALIDATION_ERROR');
    assertEqual(res.status, 400);
  });

  await executeTest('Boundaries', 'Reject non-numeric string amount ("NaN", "abc") on POST', async () => {
    const res = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 'không phải số',
      date: '2026-10-22'
    });
    assertErrorEnvelope(res.status, res.data, 'VALIDATION_ERROR');
    assertEqual(res.status, 400);
  });

  await executeTest('Boundaries', 'Reject infinite/overflow amount on POST', async () => {
    const res = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 1e309, // Evaluates to Infinity
      date: '2026-10-22'
    });
    // In JSON, Infinity serializes to null or triggers validation
    assertErrorEnvelope(res.status, res.data, 'VALIDATION_ERROR');
    assertEqual(res.status, 400);
  });

  await executeTest('Boundaries', 'Reject negative or zero amount on PUT /api/transactions/:id', async () => {
    // First create a valid transaction to update
    const createRes = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 50000,
      date: '2026-10-22',
      note: 'Temporary transaction for PUT boundary test'
    });
    assertEqual(createRes.status, 201);
    const tempId = createRes.data.data.id;

    // Try to update with negative amount
    const putRes = await rawRequest('PUT', `/api/transactions/${tempId}`, {
      amount: -25000
    });
    assertErrorEnvelope(putRes.status, putRes.data, 'VALIDATION_ERROR');
    assertEqual(putRes.status, 400);

    // Try to update with zero amount
    const putZeroRes = await rawRequest('PUT', `/api/transactions/${tempId}`, {
      amount: 0
    });
    assertErrorEnvelope(putZeroRes.status, putZeroRes.data, 'VALIDATION_ERROR');
    assertEqual(putZeroRes.status, 400);

    // Cleanup
    await rawRequest('DELETE', `/api/transactions/${tempId}`);
  });

  await executeTest('Boundaries', 'Handle extreme large amount (999,999,999,999 VND) safely', async () => {
    const extremeAmount = 999999999999;
    const res = await rawRequest('POST', '/api/transactions', {
      walletId: 'bank',
      categoryId: 'cat_salary',
      type: 'income',
      amount: extremeAmount,
      date: '2026-10-22',
      note: 'Extreme large amount boundary test'
    });
    assertEqual(res.status, 201);
    assertEqual(res.data.data.amount, extremeAmount);
    // Cleanup
    await rawRequest('DELETE', `/api/transactions/${res.data.data.id}`);
  });

  await executeTest('Boundaries', 'Reject invalid date boundaries (Feb 30, Feb 31, non-leap Feb 29)', async () => {
    const invalidDates = ['2026-02-30', '2026-02-31', '2026-02-29', '2026-13-01', '2026-00-10'];
    for (const d of invalidDates) {
      const res = await rawRequest('POST', '/api/transactions', {
        walletId: 'cash',
        categoryId: 'cat_food',
        type: 'expense',
        amount: 50000,
        date: d
      });
      assertErrorEnvelope(res.status, res.data, 'VALIDATION_ERROR');
      assertEqual(res.status, 400);
    }
  });

  await executeTest('Boundaries', 'Reject invalid budget limits (<= 0) on POST /api/budgets', async () => {
    const zeroRes = await rawRequest('POST', '/api/budgets', {
      categoryId: 'cat_food',
      month: '2026-11',
      limitAmount: 0
    });
    assertErrorEnvelope(zeroRes.status, zeroRes.data, 'VALIDATION_ERROR');

    const negRes = await rawRequest('POST', '/api/budgets', {
      categoryId: 'cat_food',
      month: '2026-11',
      limitAmount: -100000
    });
    assertErrorEnvelope(negRes.status, negRes.data, 'VALIDATION_ERROR');
  });

  await executeTest('Boundaries', 'Handle analytics division by zero & non-existent dates gracefully', async () => {
    // Far historical month with 0 transactions
    const zeroMonthRes = await rawRequest('GET', '/api/analytics/summary?month=1999-01');
    assertEqual(zeroMonthRes.status, 200);
    assertEqual(zeroMonthRes.data.data.monthlyIncome, 0);
    assertEqual(zeroMonthRes.data.data.monthlyExpense, 0);
    assertEqual(zeroMonthRes.data.data.savingsRate, 0);
    assert(!isNaN(zeroMonthRes.data.data.savingsRate), 'Savings rate must not be NaN');

    // Category breakdown for empty month
    const breakdownRes = await rawRequest('GET', '/api/analytics/category-breakdown?month=1999-01');
    assertEqual(breakdownRes.status, 200);
    assertEqual(breakdownRes.data.data.totalAmount, 0);
    assertEqual(breakdownRes.data.data.items.length, 0);
  });

  // =========================================================================
  // SUITE 3: SECURITY, INJECTION & VIETNAMESE UNICODE PRESERVATION
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}=== SUITE 3: Security Payloads, SQL Injection & Unicode Integrity ===${c.reset}`);

  const SQLI_PAYLOADS = [
    "'; DROP TABLE transactions; --",
    "' OR '1'='1",
    "1; DELETE FROM wallets; --",
    "admin' --",
    "'; VACUUM; --",
    "' UNION SELECT null, id, name FROM wallets --"
  ];

  for (let i = 0; i < SQLI_PAYLOADS.length; i++) {
    const sqli = SQLI_PAYLOADS[i];
    await executeTest('Security', `SQLi Defense #${i + 1}: Parameterized query treats payload as literal string`, async () => {
      const res = await rawRequest('POST', '/api/transactions', {
        walletId: 'cash',
        categoryId: 'cat_food',
        type: 'expense',
        amount: 25000,
        date: '2026-10-22',
        note: sqli,
        payeePayer: sqli
      });
      assertEqual(res.status, 201, `Server should accept note as literal string, got ${res.status}`);
      const txId = res.data.data.id;

      // Verify payload is stored verbatim and not executed
      const getRes = await rawRequest('GET', `/api/transactions/${txId}`);
      assertEqual(getRes.status, 200);
      assertEqual(getRes.data.data.note, sqli, 'Note must match verbatim injected SQL payload');
      assertEqual(getRes.data.data.payeePayer, sqli, 'Payee must match verbatim injected SQL payload');

      // Verify table still exists and transactions can be queried
      const listRes = await rawRequest('GET', '/api/transactions');
      assertEqual(listRes.status, 200);
      assert(Array.isArray(listRes.data.data), 'Transactions table must not be corrupted or dropped');

      // Cleanup
      await rawRequest('DELETE', `/api/transactions/${txId}`);
    });
  }

  await executeTest('Security', 'SQLi Defense in Filter Query Params: /api/transactions?search=', async () => {
    for (const sqli of SQLI_PAYLOADS) {
      const res = await rawRequest('GET', `/api/transactions?search=${encodeURIComponent(sqli)}`);
      assertEqual(res.status, 200, `Search with SQLi should return 200, got ${res.status}`);
      assert(Array.isArray(res.data.data), 'Search should return array without SQL syntax errors');
    }
  });

  await executeTest('Security', 'SQLi Defense in sortBy query parameter: /api/transactions?sortBy=', async () => {
    const badSortRes = await rawRequest('GET', `/api/transactions?sortBy=${encodeURIComponent("amount; DROP TABLE transactions; --")}`);
    assertEqual(badSortRes.status, 200, 'Server must safely sanitize or fallback invalid sortBy column');
    assert(Array.isArray(badSortRes.data.data));
  });

  const XSS_PAYLOADS = [
    "<script>alert('XSS_ATTACK')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:void(0)",
    "<svg/onload=alert('XSS')>",
    "<iframe src='javascript:alert(1)'></iframe>"
  ];

  for (let i = 0; i < XSS_PAYLOADS.length; i++) {
    const xss = XSS_PAYLOADS[i];
    await executeTest('Security', `XSS String Handling #${i + 1}: Raw string stored & served safely`, async () => {
      const res = await rawRequest('POST', '/api/transactions', {
        walletId: 'cash',
        categoryId: 'cat_food',
        type: 'expense',
        amount: 30000,
        date: '2026-10-22',
        note: xss
      });
      assertEqual(res.status, 201);
      const txId = res.data.data.id;

      const getRes = await rawRequest('GET', `/api/transactions/${txId}`);
      assertEqual(getRes.status, 200);
      assertEqual(getRes.data.data.note, xss);

      // Cleanup
      await rawRequest('DELETE', `/api/transactions/${txId}`);
    });
  }

  await executeTest('Unicode', 'Vietnamese Diacritics, Tone Marks & Multibyte Emojis verbatim round-trip', async () => {
    const vietnameseString = 'Sinh viên Trần Mạnh Dũng (DTC245160020) - Lớp K23.K1.KHMT K23A. ' +
      'Ăn bún ốc nguội Phủ Tây Hồ 🐌, phở tái lăn Lò Đúc 🍜, chả rươi Hàng Chiếu 🥞, ' +
      'trà đào cam sả trân châu hoàng kim 🍑🍹! Đề 38 - Triển khai và quản trị hệ thống phần mềm 🎓🎯🇻🇳';

    const res = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 125000,
      date: '2026-10-22',
      note: vietnameseString,
      payeePayer: 'Bà cụ 70 tuổi Hàng Than'
    });
    assertEqual(res.status, 201);
    const txId = res.data.data.id;

    // Fetch back
    const getRes = await rawRequest('GET', `/api/transactions/${txId}`);
    assertEqual(getRes.status, 200);
    assertEqual(getRes.data.data.note, vietnameseString, 'Vietnamese Unicode diacritics must not be altered, corrupted or question-marked');
    assertEqual(getRes.data.data.payeePayer, 'Bà cụ 70 tuổi Hàng Than');

    // Search by diacritic substring
    const searchRes = await rawRequest('GET', `/api/transactions?search=${encodeURIComponent('Hàng Chiếu')}`);
    assertEqual(searchRes.status, 200);
    const found = searchRes.data.data.find(t => t.id === txId);
    assert(found !== undefined, 'Vietnamese diacritic LIKE query must match correctly');

    // Cleanup
    await rawRequest('DELETE', `/api/transactions/${txId}`);
  });

  // =========================================================================
  // SUITE 4: MALFORMED PAYLOADS, NON-EXISTENT IDS & ERROR ENVELOPES
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}=== SUITE 4: Malformed Payloads, Non-Existent IDs & Standard Envelopes ===${c.reset}`);

  await executeTest('Malformed', 'Handle Malformed Non-JSON body without crashing server', async () => {
    const rawBrokenJson = '{ "amount": 50000, "note": "broken json payload, missing closing bracket';
    const res = await rawRequest('POST', '/api/transactions', rawBrokenJson, { 'Content-Type': 'application/json' });
    assertEqual(res.status, 400, 'Malformed JSON must return HTTP 400 Bad Request');
    assertErrorEnvelope(res.status, res.data, 'VALIDATION_ERROR');
  });

  await executeTest('Malformed', 'Handle Non-existent Transaction ID on GET, PUT, DELETE', async () => {
    const fakeId = 'tx_non_existent_uuid_99999999';

    // GET
    const getRes = await rawRequest('GET', `/api/transactions/${fakeId}`);
    assertEqual(getRes.status, 404);
    assertErrorEnvelope(getRes.status, getRes.data, 'NOT_FOUND');

    // PUT
    const putRes = await rawRequest('PUT', `/api/transactions/${fakeId}`, { note: 'update fake' });
    assertEqual(putRes.status, 404);
    assertErrorEnvelope(putRes.status, putRes.data, 'NOT_FOUND');

    // DELETE
    const delRes = await rawRequest('DELETE', `/api/transactions/${fakeId}`);
    assertEqual(delRes.status, 404);
    assertErrorEnvelope(delRes.status, delRes.data, 'NOT_FOUND');
  });

  await executeTest('Malformed', 'Reject Foreign Key violations on POST /api/transactions', async () => {
    // Non-existent walletId
    const badWalletRes = await rawRequest('POST', '/api/transactions', {
      walletId: 'bitcoin_wallet_not_real',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 50000,
      date: '2026-10-22'
    });
    assertEqual(badWalletRes.status, 400);
    assertErrorEnvelope(badWalletRes.status, badWalletRes.data, 'VALIDATION_ERROR');

    // Non-existent categoryId
    const badCategoryRes = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_cyberpunk_2077',
      type: 'expense',
      amount: 50000,
      date: '2026-10-22'
    });
    assertEqual(badCategoryRes.status, 400);
    assertErrorEnvelope(badCategoryRes.status, badCategoryRes.data, 'VALIDATION_ERROR');
  });

  await executeTest('Malformed', 'Handle Directory Traversal attempts without leaking or crashing', async () => {
    const traversalRes = await rawRequest('GET', '/api/transactions/..%2F..%2F..%2F..%2Fetc%2Fpasswd');
    assert([400, 404].includes(traversalRes.status), `Traversal attempt should return 400 or 404, got ${traversalRes.status}`);
    assertErrorEnvelope(traversalRes.status, traversalRes.data);
  });

  await executeTest('Malformed', 'Handle Extreme Long Note (15,000 characters) without buffer overflow', async () => {
    const massiveNote = 'Trần Mạnh Dũng '.repeat(1000);
    const res = await rawRequest('POST', '/api/transactions', {
      walletId: 'cash',
      categoryId: 'cat_food',
      type: 'expense',
      amount: 50000,
      date: '2026-10-22',
      note: massiveNote
    });
    assertEqual(res.status, 201);
    const txId = res.data.data.id;
    assertEqual(res.data.data.note.length, massiveNote.trim().length);

    // Cleanup
    await rawRequest('DELETE', `/api/transactions/${txId}`);
  });

  // =========================================================================
  // POST-STRESS HEALTH & INTEGRITY AUDIT
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}=== Final Post-Stress Server Health & Database Audit ===${c.reset}`);

  await executeTest('HealthAudit', 'Server is still 100% HEALTHY after full adversarial stress', async () => {
    const finalHealth = await rawRequest('GET', '/api/health');
    assertEqual(finalHealth.status, 200);
    assertEqual(finalHealth.data.data.status, 'healthy');
    assertEqual(finalHealth.data.data.database.connected, true);
  });

  await executeTest('HealthAudit', 'Wallets, Categories, and Budgets data remain consistent & uncorrupted', async () => {
    const wallets = await rawRequest('GET', '/api/wallets');
    assertEqual(wallets.status, 200);
    assertEqual(wallets.data.data.length, 3, 'All 3 standard wallets must exist');

    const categories = await rawRequest('GET', '/api/categories');
    assertEqual(categories.status, 200);
    assert(categories.data.data.length >= 10, 'Seeded categories must remain intact');

    const budgets = await rawRequest('GET', '/api/budgets?month=2026-10');
    assertEqual(budgets.status, 200);
    assert(Array.isArray(budgets.data.data), 'Budgets must be valid array');
  });

  // =========================================================================
  // SUMMARY & VERDICT
  // =========================================================================
  console.log(`\n${c.bold}${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}ADVERSARIAL STRESS TEST SUMMARY:${c.reset}`);
  console.log(`  Total Stress Tests Run: ${c.bold}${totalPassed + totalFailed}${c.reset}`);
  console.log(`  Passed Tests:           ${c.green}${c.bold}${totalPassed}${c.reset}`);
  console.log(`  Failed Tests:           ${totalFailed > 0 ? c.red : c.green}${c.bold}${totalFailed}${c.reset}`);

  for (const [suite, times] of Object.entries(timingStats)) {
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
    const max = Math.max(...times).toFixed(1);
    console.log(`  - Suite [${suite}]: ${times.length} tests, avg: ${avg}ms, max: ${max}ms`);
  }

  console.log(`${c.bold}${c.cyan}======================================================================${c.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${c.bold}${c.green}>>> ADVERSARIAL VERDICT: [APPROVE] <<<${c.reset}`);
    console.log(`${c.green}All rapid concurrent bursts, boundary stresses, SQLi/XSS attacks, Unicode characters, and malformed envelopes PASSED flawlessly.${c.reset}`);
    console.log(`${c.green}Zero server crashes, zero SQLITE_BUSY lock errors, 100% standard envelope adherence.${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${c.bold}${c.red}>>> ADVERSARIAL VERDICT: [CHALLENGE_FAILED] <<<${c.reset}`);
    console.log(`${c.red}${totalFailed} test(s) failed during adversarial stress testing.${c.reset}\n`);
    failureLog.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.suite}] ${f.name} -> ${f.error}`);
    });
    process.exit(1);
  }
}

runAdversarialStressSuite().catch(err => {
  console.error(`${c.bold}${c.red}FATAL ERROR IN STRESS HARNESS:${c.reset}`, err);
  process.exit(1);
});
