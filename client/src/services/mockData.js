/**
 * client/src/services/mockData.js
 * Dữ liệu mẫu 3 tháng thực tế chuẩn thi cử cho sinh viên Trần Mạnh Dũng (DTC245160020 - Đề 38)
 * 
 * Học phần: Triển khai và quản trị hệ thống phần mềm
 * Lớp: K23.K1.KHMT K23A
 */

export const MOCK_EXAM_INFO = {
  studentName: "Trần Mạnh Dũng",
  studentId: "DTC245160020",
  className: "K23.K1.KHMT K23A",
  dateOfBirth: "30/07/2006",
  subject: "Triển khai và quản trị hệ thống phần mềm",
  topic: "Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính"
};

export const MOCK_WALLETS = [
  {
    id: "cash",
    name: "Tiền mặt",
    type: "cash",
    initialBalance: 2000000,
    currentBalance: 2000000,
    icon: "Banknote",
    color: "#10B981"
  },
  {
    id: "bank",
    name: "Tài khoản Ngân hàng (ATM)",
    type: "bank",
    initialBalance: 10000000,
    currentBalance: 10000000,
    icon: "CreditCard",
    color: "#3B82F6"
  },
  {
    id: "ewallet",
    name: "Ví điện tử (Momo/ZaloPay)",
    type: "ewallet",
    initialBalance: 1500000,
    currentBalance: 1500000,
    icon: "Smartphone",
    color: "#EC4899"
  }
];

export const MOCK_CATEGORIES = [
  // Thu nhập (Income)
  { id: "cat_salary", name: "Lương hàng tháng", type: "income", icon: "Briefcase", color: "#10B981", isDefault: true },
  { id: "cat_scholarship", name: "Học bổng", type: "income", icon: "Award", color: "#059669", isDefault: true },
  { id: "cat_freelance", name: "Thu nhập làm thêm", type: "income", icon: "Laptop", color: "#34D399", isDefault: true },
  { id: "cat_gift", name: "Thưởng & Quà tặng", type: "income", icon: "Gift", color: "#6EE7B7", isDefault: true },
  { id: "cat_income_other", name: "Thu nhập khác", type: "income", icon: "TrendingUp", color: "#A7F3D0", isDefault: true },

  // Chi tiêu (Expense)
  { id: "cat_food", name: "Ăn uống & Nhà hàng", type: "expense", icon: "Utensils", color: "#EF4444", isDefault: true },
  { id: "cat_shopping", name: "Mua sắm", type: "expense", icon: "ShoppingBag", color: "#F97316", isDefault: true },
  { id: "cat_tuition", name: "Học phí & Giáo dục", type: "expense", icon: "GraduationCap", color: "#8B5CF6", isDefault: true },
  { id: "cat_housing", name: "Nhà ở & Điện nước", type: "expense", icon: "Home", color: "#6366F1", isDefault: true },
  { id: "cat_rent", name: "Tiền thuê trọ", type: "expense", icon: "Home", color: "#F97316", isDefault: true },
  { id: "cat_tech", name: "Thiết bị & Cloud", type: "expense", icon: "Server", color: "#3B82F6", isDefault: true },
  { id: "cat_transport", name: "Di chuyển & Xăng xe", type: "expense", icon: "Car", color: "#EAB308", isDefault: true },
  { id: "cat_entertainment", name: "Giải trí & Giao lưu", type: "expense", icon: "Film", color: "#EC4899", isDefault: true },
  { id: "cat_health", name: "Y tế & Sức khỏe", type: "expense", icon: "HeartPulse", color: "#14B8A6", isDefault: true },
  { id: "cat_expense_other", name: "Chi tiêu khác", type: "expense", icon: "MoreHorizontal", color: "#9CA3AF", isDefault: true }
];

export const MOCK_BUDGETS = [
  {
    id: "bgt_oct_food",
    categoryId: "cat_food",
    month: "2026-10",
    limitAmount: 3000000,
    warningThreshold: 0.80
  },
  {
    id: "bgt_oct_housing",
    categoryId: "cat_housing",
    month: "2026-10",
    limitAmount: 2500000,
    warningThreshold: 0.80
  },
  {
    id: "bgt_oct_shopping",
    categoryId: "cat_shopping",
    month: "2026-10",
    limitAmount: 500000,
    warningThreshold: 0.80
  }
];

export const MOCK_TRANSACTIONS = [
  // --- Tháng 8/2026 ---
  { id: "txn_aug_01", date: "2026-08-01", transactionDate: "2026-08-01", amount: 4000000, type: "income", walletId: "bank", categoryId: "cat_freelance", note: "Lương làm thêm hè" },
  { id: "txn_aug_02", date: "2026-08-03", transactionDate: "2026-08-03", amount: 3000000, type: "income", walletId: "bank", categoryId: "cat_gift", note: "Gia đình hỗ trợ đầu năm học" },
  { id: "txn_aug_03", date: "2026-08-05", transactionDate: "2026-08-05", amount: 6500000, type: "expense", walletId: "bank", categoryId: "cat_tuition", note: "Đóng học phí Học kỳ 1 (Đề 38)" },
  { id: "txn_aug_04", date: "2026-08-08", transactionDate: "2026-08-08", amount: 450000, type: "expense", walletId: "cash", categoryId: "cat_tuition", note: "Sách giáo trình và văn phòng phẩm" },
  { id: "txn_aug_05", date: "2026-08-12", transactionDate: "2026-08-12", amount: 1800000, type: "expense", walletId: "cash", categoryId: "cat_food", note: "Tiền ăn cả tháng 8" },
  { id: "txn_aug_06", date: "2026-08-15", transactionDate: "2026-08-15", amount: 250000, type: "expense", walletId: "cash", categoryId: "cat_transport", note: "Xăng xe đi lại" },

  // --- Tháng 9/2026 ---
  { id: "txn_sep_01", date: "2026-09-01", transactionDate: "2026-09-01", amount: 5000000, type: "income", walletId: "bank", categoryId: "cat_freelance", note: "Dự án lập trình website" },
  { id: "txn_sep_02", date: "2026-09-05", transactionDate: "2026-09-05", amount: 2000000, type: "income", walletId: "bank", categoryId: "cat_scholarship", note: "Học bổng khuyến khích học tập" },
  { id: "txn_sep_03", date: "2026-09-06", transactionDate: "2026-09-06", amount: 2500000, type: "expense", walletId: "bank", categoryId: "cat_housing", note: "Tiền trọ và điện nước tháng 9" },
  { id: "txn_sep_04", date: "2026-09-10", transactionDate: "2026-09-10", amount: 2600000, type: "expense", walletId: "ewallet", categoryId: "cat_food", note: "Ăn uống và đi chợ nấu cơm" },
  { id: "txn_sep_05", date: "2026-09-18", transactionDate: "2026-09-18", amount: 400000, type: "expense", walletId: "ewallet", categoryId: "cat_shopping", note: "Mua phụ kiện bàn phím chuột" },
  { id: "txn_sep_06", date: "2026-09-25", transactionDate: "2026-09-25", amount: 350000, type: "expense", walletId: "cash", categoryId: "cat_entertainment", note: "Liên hoan nhóm bạn" },

  // --- Tháng 10/2026 (Tháng bảo vệ thi cử) ---
  { id: "txn_oct_01", date: "2026-10-01", transactionDate: "2026-10-01", amount: 6000000, type: "income", walletId: "bank", categoryId: "cat_salary", note: "Lương thực tập doanh nghiệp" },
  { id: "txn_oct_02", date: "2026-10-05", transactionDate: "2026-10-05", amount: 1500000, type: "income", walletId: "bank", categoryId: "cat_gift", note: "Thưởng hoàn thành tiến độ dự án" },
  { id: "txn_oct_03", date: "2026-10-06", transactionDate: "2026-10-06", amount: 2500000, type: "expense", walletId: "bank", categoryId: "cat_housing", note: "Tiền trọ và internet tháng 10" },
  { id: "txn_oct_04", date: "2026-10-10", transactionDate: "2026-10-10", amount: 2800000, type: "expense", walletId: "cash", categoryId: "cat_food", note: "Ăn uống hàng ngày" },
  { id: "txn_oct_05", date: "2026-10-14", transactionDate: "2026-10-14", amount: 220000, type: "expense", walletId: "cash", categoryId: "cat_tuition", note: "In ấn báo cáo & đóng bìa Đề 38" },
  { id: "txn_oct_06", date: "2026-10-20", transactionDate: "2026-10-20", amount: 280000, type: "expense", walletId: "ewallet", categoryId: "cat_shopping", note: "Gia hạn dịch vụ cloud demo" }
];
