/**
 * src/config/env.js
 * Quản lý tập trung các biến môi trường và thông tin sinh viên dự thi
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng - MSSV: DTC245160020
 */

const path = require('path');
const dotenv = require('dotenv');

// Nạp file .env từ thư mục gốc server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_PATH: process.env.DB_PATH
    ? (path.isAbsolute(process.env.DB_PATH) ? process.env.DB_PATH : path.resolve(__dirname, '../../', process.env.DB_PATH))
    : path.resolve(__dirname, '../../data/expense_tracker.sqlite'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  EXAM_INFO: {
    studentName: process.env.STUDENT_NAME || 'Trần Mạnh Dũng',
    studentId: process.env.STUDENT_ID || 'DTC245160020',
    className: process.env.CLASS_NAME || 'K23.K1.KHMT K23A',
    dateOfBirth: process.env.DATE_OF_BIRTH || '30/07/2006',
    subject: process.env.SUBJECT || 'Triển khai và quản trị hệ thống phần mềm',
    topic: process.env.TOPIC || 'Đề 38 - Hệ thống Quản lý Chi tiêu Cá nhân & Phân tích Tài chính'
  }
};

module.exports = env;
