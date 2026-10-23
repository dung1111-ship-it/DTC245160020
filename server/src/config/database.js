/**
 * src/config/database.js
 * Quản trị kết nối CSDL SQLite bằng better-sqlite3 singleton
 * Cấu hình WAL mode, foreign keys, synchronous NORMAL, busy_timeout
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('./env');

let dbInstance = null;

/**
 * Lấy hoặc khởi tạo kết nối SQLite Database (Singleton)
 * @param {string} [customPath] Đường dẫn database tùy chọn (cho unit/integration test)
 * @returns {Database.Database} Instance better-sqlite3
 */
function getDatabase(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbFilePath = customPath || env.DB_PATH;
  const dbDir = path.dirname(dbFilePath);

  // Tự động tạo thư mục chứa file SQLite nếu chưa có
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  try {
    const db = new Database(dbFilePath, {
      verbose: env.NODE_ENV === 'debug' ? console.log : null,
      fileMustExist: false
    });

    // Cấu hình PRAGMA tối ưu hiệu năng và an toàn toàn vẹn dữ liệu
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    db.pragma('busy_timeout = 5000');

    if (!customPath) {
      dbInstance = db;
    }

    return db;
  } catch (error) {
    console.error(`[Database Error] Không thể kết nối SQLite tại "${dbFilePath}":`, error.message);
    throw error;
  }
}

/**
 * Kiểm tra tình trạng kết nối CSDL phục vụ /api/health probe
 * @returns {{ connected: boolean, path: string, error?: string }}
 */
function checkHealth() {
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT 1 AS healthy').get();
    return {
      connected: Boolean(result && result.healthy === 1),
      path: env.DB_PATH
    };
  } catch (err) {
    return {
      connected: false,
      path: env.DB_PATH,
      error: err.message
    };
  }
}

/**
 * Đóng kết nối an toàn khi tắt server
 */
function closeDatabase() {
  if (dbInstance && dbInstance.open) {
    try {
      dbInstance.close();
      dbInstance = null;
    } catch (err) {
      console.error('[Database Error] Lỗi khi đóng kết nối CSDL:', err.message);
    }
  }
}

// Bắt sự kiện thoát tiến trình để đóng kết nối an toàn
process.on('SIGINT', () => {
  closeDatabase();
});

process.on('SIGTERM', () => {
  closeDatabase();
});

module.exports = {
  getDatabase,
  checkHealth,
  closeDatabase
};
