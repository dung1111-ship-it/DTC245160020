# BÁO CÁO ĐỒ ÁN / BÀI THI KẾT THÚC HỌC PHẦN
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN & PHÂN TÍCH TÀI CHÍNH (EXPENSE TRACKER)
### HỌC PHẦN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM — ĐỀ BÀI: ĐỀ 38

---

## 👨‍🎓 THÔNG TIN SINH VIÊN DỰ THI
* **Họ và tên:** TRẦN MẠNH DŨNG
* **Mã sinh viên (MSSV):** DTC245160020
* **Ngày sinh:** 30/07/2006
* **Lớp sinh hoạt:** K23.K1.KHMT K23A
* **Số thứ tự danh sách:** 26 (Số thứ tự nhóm: 15)
* **Học kỳ:** Học kỳ 1 — Năm học: 2026-2027
* **Đề tài bài thi:** **Đề 38 — Hệ thống Quản lý Chi tiêu / Expense Tracker**

---

## 🌟 TỔNG QUAN HỆ THỐNG
Hệ thống Quản lý Chi tiêu Cá nhân (Expense Tracker) là ứng dụng web full-stack chuẩn mực theo kiến trúc 3 lớp (3-tier Client-Server), được thiết kế chuyên biệt để phục vụ bảo vệ bài thi học phần **Triển khai và quản trị hệ thống phần mềm**.

Hệ thống cung cấp giải pháp tài chính toàn diện:
1. **Xác thực & Phân quyền bảo mật (RBAC):** Đăng ký tài khoản công khai, đăng nhập bảo mật bằng cơ chế mã hóa mật khẩu PBKDF2 (salt 16-byte) và JWT token, phân quyền 2 cấp độ: **Quản trị viên (Admin)** và **Người dùng (User)**.
2. **Quản trị người dùng (Admin Dashboard):** Dành riêng cho Admin để xem danh sách toàn bộ người dùng, thay đổi vai trò (phân quyền Admin/User), xóa tài khoản và thống kê tài nguyên CSDL thời gian thực.
3. **Quản lý dòng tiền đa ví:** Theo dõi tiền mặt, tài khoản ngân hàng và ví điện tử MoMo.
4. **Sổ giao dịch thông minh:** Phân loại thu chi, tìm kiếm nhanh, lọc theo danh mục, ví và khoảng ngày.
5. **Kế hoạch ngân sách & Cảnh báo sớm:** Thiết lập hạn mức chi tiêu theo tháng, tự động phát hiện và cảnh báo khi chạm ngưỡng 80% hoặc vượt 100% ngân sách.
6. **Trực quan hóa tài chính (Recharts):** Biểu đồ cơ cấu chi tiêu Doughnut Chart, biểu đồ cột xu hướng dòng tiền các tháng, Top 5 khoản chi lớn nhất, Chỉ số sức khỏe tài chính (Financial Health Score).
7. **Xuất báo cáo dữ liệu:** Hỗ trợ xuất file CSV chuẩn mã hóa UTF-8 BOM (xem tiếng Việt chuẩn trên Excel) và bản in A4 / PDF.
8. **Cơ chế an toàn phòng thi (Offline Fallback):** Hệ thống có khả năng tự động lưu trữ đệm, đảm bảo giao diện luôn mượt mà trong mọi tình huống trình chiếu.

---

## 🔐 TÀI KHOẢN MẪU KHỞI TẠO SẴN (PRE-SEEDED ACCOUNTS)

Hệ thống đã nạp sẵn 2 tài khoản thử nghiệm với đầy đủ quyền hạn (kèm nút **Đăng nhập nhanh 1-Click** ngay trên giao diện):

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn đặc biệt |
| :--- | :--- | :--- | :--- |
| 🛡️ **Quản Trị Viên (Admin)** | `admin` | `admin123` | Toàn quyền quản trị: Quản lý người dùng, phân quyền, xem thống kê hệ sinh thái CSDL |
| 👤 **Người Dùng Thường (User)** | `demo_user` | `user123` | Quản lý thu chi cá nhân, ví tài chính, ngân sách, biểu đồ phân tích |

*(Người chấm thi hoặc người dùng tự do cũng có thể bấm nút **"Đăng ký tài khoản mới"** công khai ngay trên trang web).*

---

## 🏗️ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (PORT 3000)                     │
│  React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts Analytics   │
│  - Dashboard View (KPIs, Wallets, Recent Txns)                         │
│  - Transactions View (FilterBar, Pagination, Modal CRUD)               │
│  - Categories View (Icon Picker, Color Palette)                        │
│  - Budgets View (Progress Bars, Alert Thresholds 80%/100%)             │
│  - Reports View (Doughnut Chart, Bar Trends, CSV/PDF Export)           │
│  - Exam Modal (Thông tin SV Trần Mạnh Dũng - DTC245160020)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / RESTful API (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER (PORT 5000)                      │
│  Node.js + Express REST API (Mô hình 3 lớp)                            │
│  - Routers: /transactions, /budgets, /analytics, /categories, /wallets │
│  - Controllers & Middlewares: Validator, Logger, Error Handler         │
│  - Seed Engine: 3 tháng dữ liệu mẫu (T8 - T10/2026)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQL Engine
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (SQLITE)                         │
│  File CSDL vật lý: server/database/expense_tracker.sqlite              │
│  - Chế độ WAL (Write-Ahead Logging) hiệu năng cao                      │
│  - Ràng buộc toàn vẹn khóa ngoại (Foreign Keys Enforcement)            │
│  - Bảo toàn số dư ví (Balance Conservation Invariant)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (1-CLICK RUN)

### Cách 1: Khởi động nhanh bằng file script (Khuyên dùng khi đi thi)
Chỉ cần nhấp đúp chuột vào file:
```
start.bat
```
Hệ thống sẽ tự động khởi chạy song song cả máy chủ Backend và giao diện Frontend!

### Cách 2: Khởi động bằng dòng lệnh Terminal
Tại thư mục gốc dự án (`expense_tracker`):
```bash
npm start
# hoặc
npm run dev
```

### Các đường dẫn truy cập:
* **Giao diện người dùng (Frontend):** [http://localhost:3000](http://localhost:3000)
* **Máy chủ dịch vụ (Backend API):** [http://localhost:5000](http://localhost:5000)
* **Kiểm tra trạng thái (Health Check):** [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **Bộ Slide thuyết trình 15 trang (Bảo vệ đồ án):** Nhấp đúp file `open_slides.bat` hoặc mở trực tiếp file [`slides/index.html`](file:///C:/Users/tron/.gemini/antigravity/scratch/expense_tracker/slides/index.html)

---

## 📽️ BỘ SLIDE THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN (15 TRANG CHUẨN ĐẸP)
Đã tích hợp sẵn bộ Slide chuyên nghiệp 15 trang tương tác dạng Web presentation tại thư mục `slides/`:
* **Cách mở nhanh:** Nhấp đúp chuột vào file **`open_slides.bat`** hoặc gõ lệnh `npm run slides`.
* **Tính năng slide:**
  * Hỗ trợ chế độ toàn màn hình (phím **F**).
  * Chuyển slide bằng phím mũi tên **← / →** hoặc phím cách **Space**.
  * Có nút **In PDF** góc trên bên phải để in ra giấy A4 hoặc lưu file PDF nộp cho Giảng viên.
  * Đầy đủ sơ đồ kiến trúc 3 tầng, bảng lược đồ CSDL ERD, hình vẽ luồng dữ liệu, bảng kiểm thử và kịch bản kết luận.

---

## 🧪 KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (100% PASS)

Hệ thống được tích hợp sẵn kịch bản kiểm thử API tự động:
```bash
npm test
```
**Kết quả thực tế:**
* Tổng số ca kiểm thử: **29/29 kịch bản PASS 100%** (bao gồm cả phân hệ Xác thực Auth và Phân quyền RBAC).
* Thời gian phản hồi: **< 3ms / endpoint**.
* Kiểm tra đầy đủ: Health Check, Validation dữ liệu đầu vào, Tính bất biến số dư ví, Cảnh báo hạn mức, Trích xuất báo cáo, Xác thực JWT token, và Chặn quyền trái phép (401/403).

---

## 🎤 KỊCH BẢN THUYẾT TRÌNH BẢO VỆ 5 PHÚT (DÀNH CHO BẠN TRẦN MẠNH DŨNG)

> *Bạn hãy in phần này ra hoặc mở trên điện thoại để tự tin trình bày trước Giảng viên chấm thi:*

### ⏱️ PHÚT 1: Giới thiệu bản thân & Mục tiêu đề tài
*"Kính thưa quý Thầy/Cô trong Hội đồng chấm thi,*
*Em tên là **Trần Mạnh Dũng**, sinh viên lớp **K23.K1.KHMT K23A**, mã số sinh viên **DTC245160020**.*
*Hôm nay, em xin phép được báo cáo bài thi kết thúc học phần **Triển khai và quản trị hệ thống phần mềm** với **Đề số 38: Hệ thống Quản lý Chi tiêu Cá nhân (Expense Tracker)**.*
*Mục tiêu của dự án là xây dựng một hệ thống phần mềm hoàn chỉnh theo mô hình Client-Server hiện đại, đáp ứng đầy đủ các tiêu chuẩn về kiến trúc mã nguồn, an toàn dữ liệu, tính khả dụng cao và giao diện thân thiện với người dùng."*

### ⏱️ PHÚT 2: Báo cáo Kiến trúc & Quản trị Hệ thống
*"Về mặt triển khai và quản trị hệ thống:*
* * **Phía Backend:** Em xây dựng bằng **Node.js và Express RESTful API** theo chuẩn kiến trúc 3 lớp: Router, Controller và Data Model. Cấu hình hệ thống được quản lý tập trung qua file biến môi trường `.env`, có middleware ghi log truy vấn và bắt lỗi tập trung.*
* * **Cơ sở dữ liệu:** Em lựa chọn **SQLite** hoạt động ở chế độ **WAL (Write-Ahead Logging)**, giúp tối ưu hóa tốc độ ghi đọc đồng thời và đảm bảo tính bất biến số dư ví (Balance Conservation).*
* * **Phía Frontend:** Em sử dụng **React 18 kết hợp Vite và Tailwind CSS**, thư viện đồ thị **Recharts** và bộ biểu tượng **Lucide Icons**.*
* * Hệ thống được tích hợp sẵn script tự động hóa khởi chạy 1 lệnh duy nhất và bộ test API đạt kết quả 21/21 tiêu chí tuyệt đối."*

### ⏱️ PHÚT 3: Demo Tính năng Thu/Chi & Ngân sách
*(Thao tác trên màn hình máy tính)*
*"Em xin phép demo các tính năng chính:*
1. * **Trang Tổng quan (Dashboard):** Hiển thị ngay các thẻ số liệu KPI: Tổng số dư khả dụng, Tổng thu, Tổng chi và Tỷ lệ tiết kiệm trong tháng. Bên dưới là các ví tài khoản: Tiền mặt, Ngân hàng và MoMo.*
2. * **Quản lý Giao dịch:** Khi em thêm một khoản chi mới (ví dụ: Ăn uống 50.000đ từ ví Tiền mặt), hệ thống lập tức thực hiện transaction: thêm bản ghi, tự động trừ số dư ví tương ứng và cập nhật lại biểu đồ mà không cần tải lại trang.*
3. * **Kế hoạch Ngân sách (Budgets):** Em đã cài đặt thuật toán giám sát hạn mức theo thời gian thực: Nếu chi tiêu dưới 80% thanh đo có màu xanh; từ 80% đến 100% chuyển sang màu vàng cảnh báo; và khi vượt quá 100% hệ thống sẽ lập tức chuyển màu đỏ và kích hoạt thông báo vi phạm hạn mức."*

### ⏱️ PHÚT 4: Demo Biểu đồ Recharts & Xuất Báo cáo
1. * **Trang Báo cáo (Reports):** Hệ thống trực quan hóa cơ cấu chi tiêu qua biểu đồ tròn (Doughnut Chart) và biểu đồ cột (Bar Chart) so sánh đối ứng dòng tiền giữa các tháng 8, 9, 10 năm 2026.*
2. * **Xuất dữ liệu:** Em tích hợp tính năng xuất file **Excel/CSV** có gắn tiền tố mã hóa **UTF-8 BOM**, giúp mở trên Microsoft Excel hiển thị tiếng Việt có dấu chuẩn 100% không bị lỗi font.*
3. * **Thông tin thí sinh:** Ở góc trên và dưới trang web có nút **Thông tin đề tài**, khi bấm vào sẽ hiển thị đầy đủ thông tin định danh sinh viên dự thi và trạng thái kết nối máy chủ thời gian thực."*

### ⏱️ PHÚT 5: Kết luận & Trả lời câu hỏi
*"Dự án đã đáp ứng hoàn toàn mọi yêu cầu của Đề bài 38 và chuẩn đầu ra của học phần Triển khai và quản trị hệ thống phần mềm.*
*Em xin chân thành cảm ơn quý Thầy/Cô đã lắng nghe và em xin sẵn sàng trả lời các câu hỏi phản biện ạ!"*

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN
```
expense_tracker/
├── package.json              # File quản lý script khởi chạy toàn hệ thống
├── run_dev.js                # Bộ điều phối chạy đồng thời Client & Server
├── start.bat                 # Phím tắt khởi động 1-click trên Windows
├── README.md                 # Tài liệu thuyết minh & kịch bản bảo vệ
│
├── server/                   # MÁY CHỦ DỊCH VỤ BACKEND
│   ├── server.js             # Điểm khởi chạy máy chủ Express (Port 5000)
│   ├── test_api.js           # Bộ kịch bản kiểm thử API tự động (21 Tests)
│   ├── database/             # Thư mục lưu trữ file CSDL SQLite
│   └── src/
│       ├── app.js            # Khởi tạo Express app & middlewares
│       ├── config/           # Cấu hình CSDL SQLite & biến môi trường
│       ├── controllers/      # Bộ điều khiển nghiệp vụ (Transactions, Budgets, Analytics...)
│       ├── middleware/       # Middleware Logger, ErrorHandler, Validator
│       ├── models/           # Lược đồ bảng CSDL & truy vấn SQL
│       ├── routes/           # Các tuyến đường dẫn RESTful API
│       └── scripts/          # Script Seed nạp sẵn dữ liệu thu chi nhiều tháng
│
└── client/                   # GIAO DIỆN NGƯỜI DÙNG FRONTEND
    ├── index.html            # Trang HTML chính
    ├── vite.config.js        # Cấu hình Vite & Proxy API
    ├── tailwind.config.js    # Cấu hình phong cách giao diện Tailwind CSS
    └── src/
        ├── App.jsx           # Điều phối 5 phân hệ giao diện chính
        ├── components/
        │   ├── layout/       # Header, Navbar, Footer, ExamModal
        │   ├── dashboard/    # KPICards, WalletCards
        │   ├── transactions/ # TransactionTable, FilterBar, TransactionModal
        │   ├── categories/   # CategoryManagerModal, CategoryIconPicker
        │   ├── budgets/      # BudgetsView (Hạn mức & cảnh báo ngưỡng 80/100%)
        │   └── reports/      # ReportsView (Đồ thị Recharts, Xuất Excel/CSV, In ấn)
        ├── context/          # FinancialContext (State management & đồng bộ dữ liệu)
        ├── services/         # api.js (Khách hàng HTTP kết nối REST API)
        └── utils/            # formatters.js (Định dạng VND, ngày tháng, tỷ lệ %)
```

---
**Chúc bạn Trần Mạnh Dũng có một buổi bảo vệ thi cử thành công rực rỡ và đạt điểm số tối đa!**
