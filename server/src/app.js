/**
 * src/app.js
 * Cấu hình Express Application, middleware pipeline và định tuyến API
 */

const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { requestLogger } = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const apiRouter = require('./routes/api');

const app = express();

// 1. Cấu hình CORS
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Phân tích nội dung HTTP Request Body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Ghi log Request
app.use(requestLogger);

// Endpoint trang chủ Backend (Hỗ trợ mở trực tiếp trên trình duyệt)
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Expense Tracker Backend API - Đề 38</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center; }
          .card { max-width: 600px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          h1 { color: #818cf8; font-size: 24px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; margin: 8px 0; }
          .badge { display: inline-block; background: #312e81; color: #c7d2fe; padding: 4px 12px; border-radius: 999px; font-weight: bold; font-size: 12px; margin-bottom: 16px; }
          .btn-group { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
          .btn { display: block; padding: 12px 20px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; transition: 0.2s; }
          .btn-primary { background: #4f46e5; color: #fff; }
          .btn-primary:hover { background: #4338ca; }
          .btn-secondary { background: #334155; color: #e2e8f0; }
          .btn-secondary:hover { background: #475569; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">ĐỀ 38 • BẢO VỆ HỌC PHẦN</div>
          <h1>Hệ Thống Quản Lý Chi Tiêu (Backend API)</h1>
          <p>Sinh viên: <strong style="color:#fff;">Trần Mạnh Dũng</strong> • MSSV: <strong style="color:#818cf8;">DTC245160020</strong> • Lớp: <strong style="color:#fff;">K23.K1.KHMT K23A</strong></p>
          <p style="color:#10b981; font-weight: 600;">● Máy chủ Backend đang hoạt động ổn định trên cổng 5000</p>
          <div class="btn-group">
            <a href="http://localhost:3000" class="btn btn-primary">🚀 Mở Giao Diện Web Chính (Frontend Port 3000)</a>
            <a href="/api/health" class="btn btn-secondary">🩺 Kiểm tra Health-Check API</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  res.json({
    success: true,
    message: 'Expense Tracker REST API Server is running',
    student: 'Trần Mạnh Dũng (DTC245160020)',
    frontendUrl: 'http://localhost:3000',
    healthCheck: '/api/health'
  });
});

// 4. Định tuyến API gốc
app.use('/api', apiRouter);

// 5. Bắt lỗi 404 cho các route không tồn tại
app.use(notFoundHandler);

// 6. Xử lý lỗi tập trung chuẩn JSON Envelope
app.use(errorHandler);

module.exports = app;
