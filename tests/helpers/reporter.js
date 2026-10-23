/**
 * Test Reporter for E2E Test Suite
 * Provides structured terminal outputs, exam branding banner, and summary tables.
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function printBanner(title = "EXPENSE TRACKER - E2E TEST RUNNER") {
  console.log(`\n${colors.cyan}${colors.bright}================================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}   ${title}${colors.reset}`);
  console.log(`${colors.cyan}   Học phần: Triển khai và quản trị hệ thống phần mềm | Đề tài 38${colors.reset}`);
  console.log(`${colors.cyan}   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}================================================================================${colors.reset}\n`);
}

function printTierHeader(tierNum, tierName, description) {
  console.log(`${colors.blue}${colors.bright}--------------------------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.yellow}${colors.bright}[TIER ${tierNum}] ${tierName}${colors.reset}`);
  console.log(`${colors.dim}Description: ${description}${colors.reset}`);
  console.log(`${colors.blue}${colors.bright}--------------------------------------------------------------------------------${colors.reset}`);
}

function printTestResult(testName, passed, error = null, durationMs = 0) {
  const status = passed
    ? `${colors.green}${colors.bright}✓ PASS${colors.reset}`
    : `${colors.red}${colors.bright}✗ FAIL${colors.reset}`;

  const timeStr = `${colors.dim}(${durationMs.toFixed(1)}ms)${colors.reset}`;
  console.log(`  ${status} ${testName} ${timeStr}`);

  if (!passed && error) {
    console.log(`    ${colors.red}Error: ${error.message || error}${colors.reset}`);
    if (error.stack) {
      const filteredStack = error.stack.split('\n').slice(1, 4).map(l => `      ${colors.dim}${l.trim()}${colors.reset}`).join('\n');
      console.log(filteredStack);
    }
  }
}

function printSummary(stats, totalDurationMs) {
  console.log(`\n${colors.bright}================================================================================${colors.reset}`);
  console.log(`${colors.bright}TEST SUITE EXECUTION SUMMARY${colors.reset}`);
  console.log(`${colors.bright}================================================================================${colors.reset}`);

  for (const [tier, data] of Object.entries(stats)) {
    const rate = data.total > 0 ? ((data.passed / data.total) * 100).toFixed(1) : 0;
    const color = data.failed === 0 ? colors.green : colors.red;
    console.log(` ${tier.padEnd(28)} : Total: ${String(data.total).padStart(3)} | Passed: ${String(data.passed).padStart(3)} | Failed: ${String(data.failed).padStart(2)} | ${color}${rate}%${colors.reset}`);
  }

  console.log(`--------------------------------------------------------------------------------`);
  const total = Object.values(stats).reduce((a, b) => a + b.total, 0);
  const passed = Object.values(stats).reduce((a, b) => a + b.passed, 0);
  const failed = Object.values(stats).reduce((a, b) => a + b.failed, 0);
  const totalRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const overallColor = failed === 0 ? colors.green : colors.red;

  console.log(` ${colors.bright}TOTAL COMBINED${colors.reset.padEnd(16)} : Total: ${String(total).padStart(3)} | Passed: ${String(passed).padStart(3)} | Failed: ${String(failed).padStart(2)} | ${overallColor}${totalRate}%${colors.reset}`);
  console.log(` Total Execution Time         : ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log(` Exam Grade Readiness Gate     : ${failed === 0 ? `${colors.green}${colors.bright}[PASSED - 100% READY FOR DEFENSE]` : `${colors.red}${colors.bright}[FAILED - ACTION REQUIRED]`}${colors.reset}`);
  console.log(`${colors.bright}================================================================================${colors.reset}\n`);
}

module.exports = {
  printBanner,
  printTierHeader,
  printTestResult,
  printSummary
};
