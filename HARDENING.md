# TÀI LIỆU HƯỚNG DẪN GIA CỐ BẢO MẬT (SYSTEM HARDENING) & TRUY VẤN LOGQL
## HỌC PHẦN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM — ĐỀ 38
### Sinh viên: TRẦN MẠNH DŨNG | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A

---

## 🛡️ PHẦN 1: CÁC BIỆN PHÁP GIA CỐ BẢO MẬT (HARDENING) ĐÃ ÁP DỤNG

### 1. Hardening Tầng Nginx Reverse Proxy
* **Ẩn chữ ký phiên bản máy chủ:** `server_tokens off;` ngăn kẻ tấn công nhận diện lỗ hổng của phiên bản Nginx đang chạy.
* **Chống Brute-force & DDoS:**
  * Giới hạn tần suất chung: `limit_req_zone $binary_remote_addr zone=api_limit:10m rate=15r/s;`
  * Giới hạn nghiêm ngặt cho API đăng nhập/đăng ký: `limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;`
  * Giới hạn số lượng kết nối đồng thời trên mỗi IP: `limit_conn_zone $binary_remote_addr zone=conn_limit:10m;`
* **Security Headers chuẩn OWASP:**
  * `X-Frame-Options "DENY"`: Chống tấn công Clickjacking bằng iframe.
  * `X-Content-Type-Options "nosniff"`: Chống tấn công MIME-sniffing.
  * `X-XSS-Protection "1; mode=block"`: Kích hoạt bộ lọc chống Cross-Site Scripting.
  * `Referrer-Policy "strict-origin-when-cross-origin"`: Bảo vệ rò rỉ URL chứa dữ liệu nhạy cảm.

### 2. Hardening Tầng Container (Docker Security)
* **Non-root Execution:** Trong `server/Dockerfile`, tiến trình Node.js được chuyển quyền sang người dùng `node` (`USER node`), không bao giờ chạy dưới quyền `root`. Kẻ tấn công nếu có khai thác được code cũng không thể leo thang đặc quyền ra máy chủ host.
* **Tách biệt mạng (Network Isolation):** Tạo riêng bridge network `expense_net`, CSDL PostgreSQL và Redis/Loki không mở cổng bừa bãi ra internet mà chỉ giao tiếp trong mạng nội bộ.
* **Volume phân quyền chỉ đọc (Read-Only Mounts):** Các file cấu hình nhạy cảm (`nginx.conf:ro`, `init.sql:ro`, `prometheus.yml:ro`) đều được gắn cờ `:ro` để tránh bị container sửa đổi trái phép.

### 3. Hardening Tầng Hệ Điều Hành Máy Chủ (Linux Host)
*(Dùng để trả lời khi giảng viên hỏi về cách bảo vệ VPS/Server thực tế)*
* **Cấu hình Tường lửa UFW (Uncomplicated Firewall):**
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP Nginx
  sudo ufw allow 443/tcp   # HTTPS Nginx
  sudo ufw enable
  ```
* **Chống tấn công SSH Brute-force bằng Fail2ban:**
  Cài đặt fail2ban tự động khóa IP nếu gõ sai mật khẩu SSH hoặc request API quá 5 lần trong 1 phút.
* **Gia cố nhân Linux (Kernel Sysctl Hardening):**
  Bật cờ chống tấn công SYN Flood và IP Spoofing trong file `/etc/sysctl.conf`:
  ```ini
  net.ipv4.tcp_syncookies = 1
  net.ipv4.conf.all.rp_filter = 1
  net.ipv4.conf.all.accept_source_route = 0
  ```

---

## 🔍 PHẦN 2: SỔ TAY CÂU LỆNH TRUY VẤN LOGQL (GRAFANA LOKI)

Khi thầy cô yêu cầu truy vấn log trên Grafana (Explore -> Chọn Data Source: **Loki**):

### 1. Xem toàn bộ log của Nginx Reverse Proxy
```logql
{job="nginx"}
```

### 2. Lọc các truy vấn phát sinh lỗi HTTP 4xx hoặc 5xx trên Nginx
```logql
{job="nginx"} | json | status >= 400
```

### 3. Tìm kiếm các lỗi phát sinh trong Backend API
```logql
{job="backend"} |= "error"
```

### 4. Đếm số lượng request gọi vào API đăng nhập theo thời gian
```logql
rate({job="nginx"} |= "/api/auth/login" [1m])
```

---

## 📈 PHẦN 3: CÁC CÂU LỆNH PROMQL PHỔ BIẾN TRÊN PROMETHEUS

### 1. Đo lường tần suất truy cập hệ thống (Request Per Second - RPS)
```promql
sum(rate(http_requests_total[1m]))
```

### 2. Tỷ lệ lỗi hệ thống (Error Rate 5xx)
```promql
sum(rate(http_requests_total{status_code=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100
```

### 3. Thời gian phản hồi 95th Percentile (p95 Latency)
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))
```
