/**
 * src/middleware/logger.js
 * Middleware ghi log HTTP request chuẩn môn Quản trị hệ thống
 */

const morgan = require('morgan');

// Định nghĩa custom token xuất thời gian ISO chuẩn
morgan.token('iso-time', () => new Date().toISOString());

// Format chuẩn: [2026-10-22T10:30:00.000Z] GET /api/transactions 200 - 3.250 ms (1420 bytes)
const logFormat = '[:iso-time] :method :url :status - :response-time ms (:res[content-length] bytes)';

const requestLogger = morgan(logFormat, {
  skip: (req, res) => {
    // Tắt log khi chạy test tự động trừ khi có cờ DEBUG_LOGS=true
    return process.env.NODE_ENV === 'test' && !process.env.DEBUG_LOGS;
  }
});

module.exports = {
  requestLogger
};
