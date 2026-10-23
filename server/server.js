/**
 * server.js
 * Điểm khởi chạy HTTP Server, quản lý tiến trình và Graceful Shutdown
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng - MSSV: DTC245160020 - Lớp: K23.K1.KHMT K23A
 */

const app = require('./src/app');
const env = require('./src/config/env');
const { getDatabase, closeDatabase } = require('./src/config/database');
const { initSchema } = require('./src/models/schema');
const { seedIfEmpty } = require('./src/scripts/seed');

// Đảm bảo CSDL được kết nối, khởi tạo schema và seed dữ liệu nếu rỗng
try {
  const db = getDatabase();
  initSchema(db);
  seedIfEmpty(db);
} catch (dbError) {
  console.error('[Startup Error] Không thể kết nối cơ sở dữ liệu SQLite:', dbError.message);
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  const divider = '='.repeat(68);
  console.log(`\n${divider}`);
  console.log(`  HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN & PHÂN TÍCH TÀI CHÍNH`);
  console.log(`  Môn thi: Triển khai và quản trị hệ thống phần mềm (Đề 38)`);
  console.log(`  Sinh viên: ${env.EXAM_INFO.studentName} | MSSV: ${env.EXAM_INFO.studentId}`);
  console.log(`  Lớp: ${env.EXAM_INFO.className} | Ngày sinh: ${env.EXAM_INFO.dateOfBirth}`);
  console.log(`${divider}`);
  console.log(`  🟢 Backend API Server đang chạy tại: http://localhost:${env.PORT}`);
  console.log(`  🩺 Health Check Endpoint:           http://localhost:${env.PORT}/api/health`);
  console.log(`  📁 CSDL SQLite lưu tại:             ${env.DB_PATH}`);
  console.log(`  🌐 Môi trường:                      ${env.NODE_ENV}`);
  console.log(`${divider}\n`);
});

/**
 * Xử lý đóng ứng dụng an toàn khi nhận tín hiệu kết thúc tiến trình
 */
function handleGracefulShutdown(signal) {
  console.log(`\n[Process] Nhận tín hiệu ${signal}. Đang tiến hành đóng máy chủ an toàn...`);
  server.close(() => {
    console.log('[Process] Đã đóng các kết nối HTTP.');
    closeDatabase();
    console.log('[Process] Đã đóng kết nối CSDL SQLite. Kết thúc tiến trình thành công.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Process] Quá thời gian chờ shutdown, ép buộc dừng.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

module.exports = server;
