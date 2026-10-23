/**
 * src/controllers/healthController.js
 * Trả về trạng thái máy chủ, CSDL SQLite và thông tin bài thi sinh viên Trần Mạnh Dũng
 */

const env = require('../config/env');
const { checkHealth } = require('../config/database');

function getHealth(req, res) {
  const dbStatus = checkHealth();
  const isHealthy = dbStatus.connected;
  const httpStatus = isHealthy ? 200 : 503;

  const studentInfo = {
    student: env.EXAM_INFO.studentName,
    studentName: env.EXAM_INFO.studentName,
    studentId: env.EXAM_INFO.studentId,
    className: env.EXAM_INFO.className,
    dateOfBirth: env.EXAM_INFO.dateOfBirth,
    subject: env.EXAM_INFO.subject,
    topic: env.EXAM_INFO.topic
  };

  const responseData = {
    status: isHealthy ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime() * 100) / 100,
    timestamp: new Date().toISOString(),
    database: {
      type: 'SQLite3 (better-sqlite3)',
      connected: dbStatus.connected,
      path: dbStatus.path,
      error: dbStatus.error || null
    },
    student: studentInfo,
    examInfo: studentInfo,
    project: studentInfo
  };

  return res.status(httpStatus).json({
    success: isHealthy,
    data: responseData
  });
}

module.exports = {
  getHealth
};
