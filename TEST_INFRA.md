# TEST_INFRA.md — E2E Test Suite Architecture & Infrastructure
## Đề 38: Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính (Expense Tracker)
**Sinh viên thực hiện:** Trần Mạnh Dũng | **MSSV:** DTC245160020 | **Lớp:** K23.K1.KHMT K23A  
**Học phần:** Triển khai và quản trị hệ thống phần mềm | **Khóa:** 2023 - 2027

---

## 1. Overview & Strategy

The E2E Test Suite for the Expense Tracker project is built as an independent, opaque-box, requirement-driven verification system. It guarantees exam-grade reliability for student Trần Mạnh Dũng (DTC245160020) by testing the application strictly through public API contracts, user-facing invariants, and boundary conditions.

The test infrastructure adopts a 5-Tier Testing Pyramid:
```
+-------------------------------------------------------------------------+
|                  TIER 5: Adversarial & Stress Hardening                 |
|       (Crash recovery, extreme payload injection, offline resilience)   |
+-------------------------------------------------------------------------+
|                TIER 4: Real-World Workload Scenarios                    |
|    (Trần Mạnh Dũng 3-month realistic financial lifecycle Aug-Oct 2026)  |
+-------------------------------------------------------------------------+
|            TIER 3: Cross-Feature Pairwise & Stateful Invariants         |
|      (Wallet balance sync, budget 80%/100% threshold alerts, FKs)       |
+-------------------------------------------------------------------------+
|                 TIER 2: Boundary & Corner Case Coverage                 |
|       (Zero/negative amounts, Unicode/diacritics, SQLi/XSS, dates)      |
+-------------------------------------------------------------------------+
|                   TIER 1: Isolated Feature Coverage                     |
|           (All 24 inventoried features F01-F24 tested cleanly)          |
+-------------------------------------------------------------------------+
```

---

## 2. Test Architecture & Harness Design

### 2.1. Dual-Mode Execution Engine
The test harness is designed with dual-mode flexibility to support progressive testing across all development milestones:

1. **Live Server Mode (`LIVE_HTTP`)**:
   - Executes real HTTP requests against the running Node.js / Express backend (`http://localhost:5000` or `API_BASE_URL`).
   - Verifies HTTP status codes (200, 201, 400, 404, 500), CORS headers, JSON envelope format (`success`, `data`, `error`), and SQLite persistence.
   - Automatically detects if the server is already active, or launches `server/server.js` on demand.

2. **Contract Oracle Mode (`ORACLE_SPEC`)**:
   - An in-memory, deterministic reference oracle implementing the formal business logic and data contracts defined in `PROJECT.md` and `survey_requirements.md`.
   - Used during initial test authoring, continuous integration, and progressive verification when the server is not yet deployed.
   - Ensures that tests are authoritative and verifiable independently of backend development velocity.

### 2.2. Zero External Dependency Philosophy
The test harness runs directly on **Node.js LTS (v20+)** using standard native modules:
- `node:test`: Native test runner with subtest hierarchies.
- `node:assert/strict`: Strict assertion primitives.
- `node:http` & global `fetch`: Native HTTP/1.1 and REST communication.
- `node:fs` & `node:path`: File system and export verification.
- `node:child_process`: Subprocess execution and server health probes.

This eliminates dependency conflicts, npm registry failures, or build issues during classroom/exam presentation.

---

## 3. Test Directory & File Layout

```
expense_tracker/
├── tests/
│   ├── package.json                   # Test runner scripts & configuration
│   ├── run_tests.js                   # Unified runner with tier-by-tier reporting & stats
│   ├── helpers/
│   │   ├── client.js                  # Unified API Client (Live HTTP & Oracle Adapter)
│   │   ├── oracle.js                  # Formal Specification Reference Oracle
│   │   └── reporter.js                # ANSI colorized test reporter & summary generator
│   └── e2e/
│       ├── tier1_features.test.js     # F01-F24 feature coverage in isolation
│       ├── tier2_boundaries.test.js   # BVA, edge cases, special characters, SQLi/XSS
│       ├── tier3_pairwise.test.js     # Cross-feature combinations & state invariants
│       └── tier4_workloads.test.js    # 3-month realistic student workload scenario
├── TEST_INFRA.md                      # This infrastructure specification document
├── TEST_READY.md                      # Published verification status & test matrix
└── PROJECT.md                         # Architectural source of truth
```

---

## 4. Tier-by-Tier Coverage Matrix

### Tier 1: Feature Coverage (F01 – F24)
Tests every feature in isolation against documented inputs and outputs:
- **F01**: Server architecture, HTTP JSON envelope `{ success: true, data: ... }`, CORS.
- **F02**: Database schema, tables (`categories`, `wallets`, `transactions`, `budgets`), foreign keys.
- **F03**: Seed data populating realistic 3-month transactions (Aug, Sep, Oct 2026).
- **F04**: Transaction REST API (GET with pagination/filter, POST, PUT, DELETE).
- **F05**: Categories & Wallets (CRUD categories, GET wallets with dynamic balance).
- **F06**: Budgets & Threshold Alerts (CRUD budgets, progress calculations).
- **F07**: Financial Analytics (KPI summary, category breakdown, cash flow trends).
- **F08**: Health check & Exam metadata (Trần Mạnh Dũng, DTC245160020, K23.K1.KHMT K23A, Đề 38).
- **F09 - F24**: UI data contracts, export engine formats (Excel/CSV with UTF-8 BOM `\uFEFF`), print styling, offline fallback contracts.

### Tier 2: Boundary & Corner Cases
- **Amounts**:
  - `amount <= 0` (e.g. `0`, `-50000`): rejected with `400 Bad Request` and descriptive error.
  - Non-numeric strings (`"abc"`, `NaN`): rejected with validation error.
  - Very large amounts (`999,999,999,999 VND`): handled cleanly without floating-point overflow.
  - Decimal values (`150000.50`): handled appropriately without rounding errors.
- **Dates**:
  - Invalid formats (`"not-a-date"`, `"2026-13-45"`, `"31/02/2026"`): rejected.
  - Boundary dates (leap year Feb 29, year boundaries Dec 31 / Jan 01).
- **Encoding & Escaping Integrity**:
  - Full Vietnamese diacritics: `"Ăn bún chả Hà Nội 🍜, bánh mì pate trứng 🥖, cà phê sữa đá ☕"`.
  - SQL Injection probe: `"'; DROP TABLE transactions; --"`, `"' OR '1'='1"`.
  - XSS script probe: `"<script>alert('xss')</script>"`.
  - Empty notes vs. 10,000 character descriptions.
- **Budgets & Mathematical Limits**:
  - Zero budget limit: rejected.
  - Division by zero protection: Monthly income = 0 with expense > 0 yields Savings Rate = 0% (no `NaN`/`Infinity`).
  - Boundary percentages: exactly 79.9% (safe), exactly 80.0% (warning), exactly 99.9% (warning), exactly 100.0% (exceeded).

### Tier 3: Cross-Feature Pairwise & Stateful Invariants
- **Pair 1: Transaction Lifecycle <-> Wallet Balances**:
  - Adding income of $X$ increases wallet balance by $+X$.
  - Adding expense of $Y$ decreases wallet balance by $-Y$.
  - Updating transaction amount from $Y$ to $Z$ accurately adjusts balance by $-(Z - Y)$.
  - Deleting transaction restores balance to original state.
- **Pair 2: Transaction Lifecycle <-> Category Budget Progress & Alerts**:
  - Budget with limit 1,000,000 VND.
  - Spending 500,000 VND -> 50% (`safe`).
  - Spending 300,000 VND -> 80% (`warning` alert fired).
  - Spending 250,000 VND -> 105% (`exceeded` alert fired).
  - Deleting/updating transactions reverses progress and restores alert statuses.
- **Pair 3: Category Deletion Integrity**:
  - Deleting a category with active transactions must either reject deletion or reassign to default "Khác" (uncategorized), maintaining foreign key consistency.
- **Pair 4: Multi-Filter Integrity**:
  - Combined query (`walletId` + `type` + `dateRange` + `search`) returns the exact intersection of criteria.
  - Sum of filtered transactions matches the analytics aggregate for that subset.

### Tier 4: Real-World Workload Scenarios
Simulates realistic 3-month student financial flow for **Trần Mạnh Dũng (DTC245160020)**:
- **August 2026 (Semester Start & Tuition)**:
  - Incomes: Part-time salary (4,000,000 VND), Family allowance (3,000,000 VND).
  - Expenses: Tuition fee (6,500,000 VND), Books (450,000 VND), Food (1,800,000 VND), Transport (250,000 VND).
- **September 2026 (Mid-Semester Study)**:
  - Incomes: Web dev freelance (5,000,000 VND), Academic scholarship (2,000,000 VND).
  - Expenses: Rent & utilities (2,500,000 VND), Food (2,600,000 VND), Study tools (400,000 VND), Socializing (350,000 VND).
- **October 2026 (Final Project Defense - Đề 38)**:
  - Incomes: Internship stipend (6,000,000 VND), Bonus (1,500,000 VND).
  - Expenses: Report printing & presentation materials (220,000 VND), High-speed internet (280,000 VND), Rent (2,500,000 VND), Food (2,800,000 VND).
- **Workload Verification**:
  - Cumulative balance consistency across all 3 wallets (Cash, Bank, E-Wallet).
  - Multi-month trend calculations accurately returning 3 distinct data points.
  - Export data generation containing all student records with UTF-8 BOM encoding.

---

## 5. Execution & CLI Commands

### 5.1. Run Entire Test Suite
```bash
# From workspace root
npm test

# Or directly from tests folder
cd tests
npm test
# Or
node run_tests.js
```

### 5.2. Run Individual Tiers
```bash
node tests/run_tests.js --tier=1    # Run only Feature Coverage (F01-F24)
node tests/run_tests.js --tier=2    # Run only Boundary & Corner Cases
node tests/run_tests.js --tier=3    # Run only Pairwise & Integration
node tests/run_tests.js --tier=4    # Run only Real-World Workloads
```

### 5.3. Force Execution Mode
```bash
# Force Live Server Mode (targets running backend at port 5000)
API_BASE_URL=http://localhost:5000 node tests/run_tests.js

# Force Oracle Specification Mode
FORCE_ORACLE=true node tests/run_tests.js
```

---

## 6. Pass/Fail Criteria & Exit Codes

- **Exit Code 0**: All tests across all requested tiers passed (100% pass rate).
- **Exit Code 1**: One or more assertions failed, validation error occurred, or API contract breached.
- **Reporting Output**:
  - Detailed per-tier execution log with ANSI color coding (green pass, red fail).
  - Execution summary table detailing Total Tests, Passed, Failed, and Execution Duration.
  - Exam identification banner on every test report.
