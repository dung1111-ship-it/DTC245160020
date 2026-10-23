#!/usr/bin/env node
/**
 * Master Test Runner for Expense Tracker E2E Test Suite
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 */

const { ApiTestClient } = require('./helpers/client');
const { printBanner, printTierHeader, printTestResult, printSummary } = require('./helpers/reporter');
const { runTier1Tests } = require('./e2e/tier1_features.test');
const { runTier2Tests } = require('./e2e/tier2_boundaries.test');
const { runTier3Tests } = require('./e2e/tier3_pairwise.test');
const { runTier4Tests } = require('./e2e/tier4_workloads.test');

async function main() {
  const args = process.argv.slice(2);
  let targetTier = null;
  for (const arg of args) {
    if (arg.startsWith('--tier=')) {
      targetTier = parseInt(arg.split('=')[1], 10);
    }
  }

  printBanner("EXPENSE TRACKER — AUTOMATED E2E TEST RUNNER");

  const client = new ApiTestClient();
  const mode = await client.detectMode();
  console.log(`[INIT] Execution Mode: \x1b[36m\x1b[1m${mode}\x1b[0m ${mode === 'LIVE_HTTP' ? `(Target: ${client.baseUrl})` : '(Deterministic Contract Specification Oracle)'}\n`);

  const stats = {};
  const totalStart = performance.now();

  // Tier 1: Isolated Feature Coverage (F01 - F24)
  if (!targetTier || targetTier === 1) {
    printTierHeader(1, "FEATURE COVERAGE (F01 - F24)", "Verifies all 24 inventoried features in isolation");
    const t1Results = await runTier1Tests(client);
    let passed = 0;
    let failed = 0;
    for (const r of t1Results) {
      printTestResult(r.name, r.passed, r.error, r.durationMs);
      if (r.passed) passed++;
      else failed++;
    }
    stats["Tier 1 (Feature Coverage)"] = { total: t1Results.length, passed, failed };
    console.log();
  }

  // Tier 2: Boundary & Corner Cases
  if (!targetTier || targetTier === 2) {
    printTierHeader(2, "BOUNDARY & CORNER CASES", "Boundary Value Analysis, Zero/Negative amounts, Unicode, SQLi/XSS");
    const t2Results = await runTier2Tests(client);
    let passed = 0;
    let failed = 0;
    for (const r of t2Results) {
      printTestResult(r.name, r.passed, r.error, r.durationMs);
      if (r.passed) passed++;
      else failed++;
    }
    stats["Tier 2 (Boundary & Corner)"] = { total: t2Results.length, passed, failed };
    console.log();
  }

  // Tier 3: Cross-Feature Pairwise & Stateful Invariants
  if (!targetTier || targetTier === 3) {
    printTierHeader(3, "CROSS-FEATURE PAIRWISE", "State transitions: Transactions <-> Wallets <-> Budgets <-> Categories");
    const t3Results = await runTier3Tests(client);
    let passed = 0;
    let failed = 0;
    for (const r of t3Results) {
      printTestResult(r.name, r.passed, r.error, r.durationMs);
      if (r.passed) passed++;
      else failed++;
    }
    stats["Tier 3 (Pairwise & Invariants)"] = { total: t3Results.length, passed, failed };
    console.log();
  }

  // Tier 4: Real-World Workload Scenarios
  if (!targetTier || targetTier === 4) {
    printTierHeader(4, "REAL-WORLD WORKLOADS", "Semester lifecycle for Trần Mạnh Dũng (DTC245160020) across 3 wallets");
    const t4Results = await runTier4Tests(client);
    let passed = 0;
    let failed = 0;
    for (const r of t4Results) {
      printTestResult(r.name, r.passed, r.error, r.durationMs);
      if (r.passed) passed++;
      else failed++;
    }
    stats["Tier 4 (Real-World Workloads)"] = { total: t4Results.length, passed, failed };
    console.log();
  }

  const totalDuration = performance.now() - totalStart;
  printSummary(stats, totalDuration);

  const totalFailed = Object.values(stats).reduce((acc, curr) => acc + curr.failed, 0);
  process.exit(totalFailed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});
