/**
 * server/src/utils/metrics.js
 * Prometheus Metrics Exporter for Expense Tracker Backend (Đề 38)
 * 
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

const client = require('prom-client');

// Khởi tạo Prometheus Register mặc định
const register = new client.Registry();

// Thu thập các metrics hệ thống mặc định (CPU, Memory, Event Loop, GC)
client.collectDefaultMetrics({
  register,
  prefix: 'expense_tracker_'
});

// 1. Counter: Tổng số lượt HTTP request phân theo method, route, status_code
const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Tổng số lượt HTTP request gửi tới Expense Tracker Backend API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 2. Histogram: Thời gian xử lý request (Latency)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP request tính bằng giây',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// 3. Gauge: Tổng số giao dịch thu chi hiện có trong CSDL
const activeTransactionsGauge = new client.Gauge({
  name: 'expense_tracker_total_transactions',
  help: 'Số lượng giao dịch tài chính hiện có trong cơ sở dữ liệu',
  registers: [register]
});

// Middleware ghi nhận metrics cho mỗi request
function metricsMiddleware(req, res, next) {
  // Bỏ qua endpoint /metrics để tránh vòng lặp
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: statusCode
    });

    httpRequestDurationSeconds.observe({
      method: req.method,
      route,
      status_code: statusCode
    }, duration);
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  activeTransactionsGauge
};
