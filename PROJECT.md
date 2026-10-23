# Project: Expense Tracker (Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm)

**Sinh viên thực hiện:** Trần Mạnh Dũng  
**MSSV:** DTC245160020  
**Lớp:** K23.K1.KHMT K23A  
**Ngày sinh:** 30/07/2006  
**Học phần:** Triển khai và quản trị hệ thống phần mềm (Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính)  

---

## Architecture

The system is constructed with a 3-Tier Client-Server architecture adhering strictly to university examination standards for "Software Deployment and System Administration", augmented with a transparent Client-Side Offline Fallback Layer:

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (Frontend)                           |
|  React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts                         |
|  - Dashboard (KPI Cards, Wallet Balances, Recent Transactions, Financial Tips)     |
|  - Analytics (Recharts Doughnut/Pie for Categories, Area/Bar for Cash Flow)       |
|  - Transaction Management (CRUD, Search, Multi-criteria Filtering)                |
|  - Budget Management (Category Limits, Visual Progress Bars, 80%/100% Alerts)     |
|  - Export Module (Excel .xlsx, CSV with UTF-8 BOM, Print CSS A4 Friendly)         |
|  - Academic Exam Branding (Header/Footer Badges, Student Info Modal)              |
+-----------------------------------------------------------------------------------+
                                          │
                        Unified ApiClient (Adapter Pattern)
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │ (Server Available)                            │ (Server Down / Offline)
                  ▼                                               ▼
+-----------------------------------+           +-----------------------------------+
|       APPLICATION TIER (API)      |           |     OFFLINE FALLBACK ENGINE       |
|  Node.js (v20) + Express REST API |           |  Browser LocalStorage Storage     |
|  - Port 5000 (Vite Proxy /api)    |           |  - Identical Entity Contracts     |
|  - Routes / Controllers / Models  |           |  - Auto-seeding on empty state    |
|  - Morgan Logging & CORS          |           |  - Zero-blank-screen reliability  |
|  - Input Validation & Error Envelopes         |  - Status Badge: LocalStorage Mode|
+-----------------------------------+           +-----------------------------------+
                  │
                  ▼
+-----------------------------------------------------------------------------------+
|                             PERSISTENCE TIER (Database)                           |
|  SQLite 3 (`better-sqlite3@^11.8.1` - synchronous, precompiled for Node 20 ABI)  |
|  - Database file: `server/data/expense_tracker.sqlite`                            |
|  - Tables: categories, wallets, transactions, budgets                             |
|  - Views: v_budget_progress                                                       |
|  - Automated DDL schema migration & seed runner on boot                           |
+-----------------------------------------------------------------------------------+
```

---

## Feature Inventory

Every feature from the Survey phase is enumerated below with its assigned milestone:

| # | Feature Code | Feature Name | Description | Milestone | Source |
|---|--------------|--------------|-------------|-----------|--------|
| 1 | F01 | Server Architecture & Express API | Express server with routes/controllers/models, Morgan, CORS, .env | M1 | ORIGINAL_REQUEST §R1 & Note |
| 2 | F02 | SQLite Database & Schema Migration | Physical SQLite file, DDL auto-migration, foreign keys, indexes | M1 | ORIGINAL_REQUEST §R1 & Note |
| 3 | F03 | Multi-Month Database Seed Script | Automated seed script populating 3 months (Aug, Sep, Oct 2026) | M1 | ORIGINAL_REQUEST §R1, Criteria |
| 4 | F04 | Transaction REST Endpoints | GET (filter/paginate), POST, PUT, DELETE /api/transactions | M1 | ORIGINAL_REQUEST §R2 |
| 5 | F05 | Category & Wallet Endpoints | CRUD /api/categories, GET /api/wallets with balance calculation | M1 | ORIGINAL_REQUEST §R2 |
| 6 | F06 | Budget & Alert Endpoints | CRUD /api/budgets, GET /api/budgets/progress with alert status | M1 | ORIGINAL_REQUEST §R4 |
| 7 | F07 | Analytics & Summary Endpoints | GET /api/analytics/summary, /category-breakdown, /flow-trend | M1 | ORIGINAL_REQUEST §R3 |
| 8 | F08 | Health Check & Student Branding API | GET /api/health returning server status & student exam metadata | M1 | ORIGINAL_REQUEST §R1, R5 |
| 9 | F09 | Frontend Shell & Navigation | React + Vite + Tailwind shell, responsive layout, dark/light theme | M2 | ORIGINAL_REQUEST §R1, Criteria |
| 10 | F10 | Student Exam Branding UI | Header/footer badges, Exam Info Modal for Trần Mạnh Dũng (DTC245160020) | M2 | ORIGINAL_REQUEST §R5 |
| 11 | F11 | Financial KPI Summary Cards | Total Balance, Monthly Income, Monthly Expense, Savings Rate (%) | M2 | ORIGINAL_REQUEST §R3 |
| 12 | F12 | Wallet Overview Cards | Balances for Cash, ATM/Bank Card, and E-Wallets (Momo/ZaloPay) | M2 | ORIGINAL_REQUEST §R2 |
| 13 | F13 | Transaction CRUD Interface | Table/Card view, Add/Edit modal with validation, Delete confirm | M2 | ORIGINAL_REQUEST §R2 |
| 14 | F14 | Search & Multi-criteria Filtering | Search by note/keyword, filter by date range, type, wallet, category | M2 | ORIGINAL_REQUEST §R2 |
| 15 | F15 | Category Management UI | Modal/page to view, add, edit categories with icons and color pickers | M2 | ORIGINAL_REQUEST §R2 |
| 16 | F16 | Category Breakdown Doughnut Chart | Recharts Pie/Doughnut chart with custom tooltips, legend, center summary| M3 | ORIGINAL_REQUEST §R3 |
| 17 | F17 | Income vs Expense Trend Chart | Recharts Area/Bar chart comparing monthly/weekly cash flow | M3 | ORIGINAL_REQUEST §R3 |
| 18 | F18 | Top Expenses & Financial Tips | Top 5 largest expenses in period, dynamic smart financial advice tips | M3 | ORIGINAL_REQUEST §R3 |
| 19 | F19 | Budget Management & Progress Bars | Set monthly limits per category, progress bar (Green <80%, Yellow <100%, Red >100%) | M3 | ORIGINAL_REQUEST §R4 |
| 20 | F20 | Budget Alert & Notification Center | Warning badges/banners when spending approaches or exceeds threshold | M3 | ORIGINAL_REQUEST §R4 |
| 21 | F21 | Offline Fallback & LocalStorage Adapter | Transparent fallback if backend is offline, pre-seeded, status pill | M3 | ORIGINAL_REQUEST §R1, Criteria |
| 22 | F22 | Data Export Module (Excel / CSV) | Export to Excel (.xlsx) and CSV with UTF-8 BOM for Microsoft Excel | M4 | ORIGINAL_REQUEST §R5 |
| 23 | F23 | Print-Friendly / PDF Report View | Clean `@media print` styling on A4 paper with student branding header | M4 | ORIGINAL_REQUEST §R5 |
| 24 | F24 | Single-Command Runner & Defense Script | Root `concurrently` run script, `dev.js`, README.md, 5-min demo script | M4 | ORIGINAL_REQUEST §R1, Criteria |
| 25 | F25 | Full Test Suite & E2E Acceptance Pass | 100% pass of Tiers 1-4 requirement tests and Tier 5 adversarial tests | M5 | Acceptance Criteria |

*Cross-check Verification: Total features = 25. All features are assigned to a milestone (M1: 8, M2: 7, M3: 6, M4: 3, M5: 1). Zero unassigned features.*

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent opaque-box test harness (Tiers 1-4: Category-Partition, BVA, Pairwise, Real-world workloads), automated test runner, outputs `TEST_READY.md` | none | DONE (TEST_READY.md published) |
| 1 | Milestone 1: Backend Service & SQLite Database | Express RESTful API, `better-sqlite3@^11.8.1`, schema migration, multi-month realistic seed script, Morgan logging, CORS, API endpoints for all core resources | none | DONE (Gate PASSED) |
| 2 | Milestone 2: Frontend Dashboard & Core UI | Vite + React + Tailwind shell, Student exam branding header/footer, KPI cards, Wallet cards, Transaction CRUD with search & multi-filter, Category management modal | M1 contracts | IN_PROGRESS |
| 3 | Milestone 3: Budgeting, Analytics & Offline Fallback | Recharts Doughnut & Flow charts, Top expenses, financial tips, Budget progress & threshold alerts, ApiClient LocalStorage Fallback Adapter with live status pill | M2 | PLANNED |
| 4 | Milestone 4: Export Engine, Exam Branding & Documentation | Excel (.xlsx) export, UTF-8 BOM CSV export, Print CSS A4 styling, README.md with deployment guide, 5-minute defense demo script, root launch script (`npm run dev` / `dev.js`) | M3 | PLANNED |
| 5 | Milestone 5: E2E Integration, Final Verification & Gate | Run full E2E test suite (Tiers 1-4), adversarial test hardening (Tier 5), console error audit, startup verification, seed data consistency check, final defense readiness | M4, E2E `TEST_READY.md` | PLANNED |

---

## Interface Contracts

### 1. Common API Response Envelope
All Express REST endpoints return JSON with standard envelopes:
```json
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive message",
  "meta": { "total": 100, "page": 1, "limit": 20 }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | INTERNAL_ERROR",
    "message": "Human-readable error details"
  }
}
```

### 2. Core Resource Contracts

#### Category:
```typescript
interface Category {
  id: string; // e.g. "cat_food", "cat_salary"
  name: string; // e.g. "Ăn uống", "Lương thưởng"
  type: "income" | "expense";
  icon: string; // Lucide icon name, e.g. "Utensils", "Briefcase"
  color: string; // Hex code or Tailwind color, e.g. "#EF4444"
  isDefault?: boolean;
}
```

#### Wallet:
```typescript
interface Wallet {
  id: "cash" | "bank" | "ewallet";
  name: string; // "Tiền mặt", "Tài khoản Ngân hàng (ATM)", "Ví điện tử (Momo/ZaloPay)"
  icon: string; // "Banknote", "CreditCard", "Smartphone"
  color: string;
  initialBalance: number;
  currentBalance: number; // Computed: initial + sum(incomes) - sum(expenses)
}
```

#### Transaction:
```typescript
interface Transaction {
  id: string; // UUID or timestamp string
  date: string; // YYYY-MM-DD
  amount: number; // Positive number (VND)
  type: "income" | "expense";
  walletId: "cash" | "bank" | "ewallet";
  categoryId: string; // Foreign key referencing Category.id
  note: string; // e.g. "Ăn trưa bún bò", "Nhận lương thực tập"
  createdAt?: string;
  updatedAt?: string;
}
```

#### Budget:
```typescript
interface Budget {
  id: string;
  categoryId: string; // Category being budgeted
  month: string; // YYYY-MM, e.g. "2026-10"
  limitAmount: number; // Allocated ceiling in VND
  spentAmount?: number; // Computed sum of expense transactions in month for category
  remainingAmount?: number; // limitAmount - spentAmount
  percentage?: number; // (spentAmount / limitAmount) * 100
  status?: "safe" | "warning" | "exceeded"; // <80%: safe, 80-100%: warning, >100%: exceeded
}
```

#### Student Exam Information:
```typescript
interface ExamInfo {
  studentName: "Trần Mạnh Dũng";
  studentId: "DTC245160020";
  className: "K23.K1.KHMT K23A";
  dateOfBirth: "30/07/2006";
  subject: "Triển khai và quản trị hệ thống phần mềm";
  topic: "Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính";
}
```

### 3. Frontend ApiService & Fallback Contract
```typescript
interface ApiAdapter {
  isAvailable(): Promise<boolean>;
  getHealth(): Promise<HealthResponse>;
  getTransactions(filters?: TransactionFilter): Promise<Transaction[]>;
  createTransaction(data: CreateTransactionDTO): Promise<Transaction>;
  updateTransaction(id: string, data: UpdateTransactionDTO): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  getCategories(): Promise<Category[]>;
  createCategory(data: CreateCategoryDTO): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryDTO): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  getWallets(): Promise<Wallet[]>;
  getBudgets(month: string): Promise<Budget[]>;
  setBudget(data: SetBudgetDTO): Promise<Budget>;
  deleteBudget(id: string): Promise<boolean>;
  getAnalyticsSummary(month: string): Promise<AnalyticsSummary>;
}
```

---

## Code Layout

```
expense_tracker/
├── .agents/                          # Coordination & agent metadata ONLY
│   └── teamwork/
├── server/                           # Backend Application Tier
│   ├── data/
│   │   └── expense_tracker.sqlite   # SQLite database file (auto-created)
│   ├── src/
│   │   ├── config/                   # Database connection & env config
│   │   │   ├── database.js
│   │   │   └── env.js
│   │   ├── controllers/              # Request handlers
│   │   │   ├── transactionController.js
│   │   │   ├── categoryController.js
│   │   │   ├── walletController.js
│   │   │   ├── budgetController.js
│   │   │   ├── analyticsController.js
│   │   │   └── healthController.js
│   │   ├── models/                   # SQLite query models & schema migrations
│   │   │   ├── schema.js
│   │   │   ├── transactionModel.js
│   │   │   ├── categoryModel.js
│   │   │   ├── walletModel.js
│   │   │   └── budgetModel.js
│   │   ├── routes/                   # Express router definitions
│   │   │   ├── api.js
│   │   │   ├── transactions.js
│   │   │   ├── categories.js
│   │   │   ├── wallets.js
│   │   │   ├── budgets.js
│   │   │   └── analytics.js
│   │   ├── middleware/               # Logger, error handler, CORS
│   │   │   ├── logger.js
│   │   │   └── errorHandler.js
│   │   ├── scripts/                  # Seed script & CLI tools
│   │   │   └── seed.js
│   │   └── app.js                    # Express app initialization
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── server.js                     # Server entrypoint (Port 5000)
├── client/                           # Frontend Presentation Tier
│   ├── src/
│   │   ├── assets/
│   │   ├── components/               # UI components
│   │   │   ├── layout/               # Header, Footer, StudentBadge, ExamModal
│   │   │   ├── dashboard/            # KPICards, WalletCards, RecentList, Tips
│   │   │   ├── transactions/         # TransactionTable, FilterBar, TransactionModal
│   │   │   ├── categories/           # CategoryManagerModal, CategoryIconPicker
│   │   │   ├── budgets/              # BudgetList, BudgetProgressBar, BudgetModal, AlertBanner
│   │   │   ├── analytics/            # CategoryDoughnutChart, CashFlowTrendChart, TopExpenses
│   │   │   ├── export/               # ExportModal, PrintView
│   │   │   └── common/               # Button, Modal, Input, Badge, StatusPill
│   │   ├── services/                 # API & Offline Fallback Layer
│   │   │   ├── api.js                # Unified ApiService
│   │   │   ├── httpAdapter.js        # Axios / Fetch to Express backend
│   │   │   ├── storageAdapter.js     # LocalStorage fallback engine
│   │   │   └── mockData.js           # Multi-month default seed data
│   │   ├── utils/                    # Formatters (VND currency, date) & export helpers (xlsx, csv)
│   │   │   ├── formatters.js
│   │   │   └── exportHelpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind CSS directives
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── tests/                            # E2E & Integration Testing Track
│   ├── e2e/
│   │   ├── tier1_features.test.js
│   │   ├── tier2_boundaries.test.js
│   │   ├── tier3_pairwise.test.js
│   │   └── tier4_workloads.test.js
│   ├── run_tests.js                  # Automated test runner script
│   └── package.json
├── package.json                      # Root launcher with concurrently
├── dev.js                            # Pure Node.js zero-dependency concurrent runner
├── PROJECT.md                        # Master architectural blueprint
├── README.md                         # Deployment guide, system architecture & 5-minute defense script
└── TEST_READY.md                     # Published by E2E Testing Track when test suite is verified
```
