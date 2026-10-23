/**
 * server/src/models/userModel.js
 * Model Quản lý Dữ liệu Người Dùng & Phân Quyền (RBAC)
 * 
 * Đề 38 - Môn Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

const { getDatabase } = require('../config/database');
const { hashPassword } = require('../utils/authHelper');

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, salt, ...safeUser } = user;
  return {
    id: safeUser.id,
    username: safeUser.username,
    email: safeUser.email,
    fullName: safeUser.full_name || safeUser.fullName,
    studentId: safeUser.student_id || safeUser.studentId,
    role: safeUser.role || 'user',
    avatar: safeUser.avatar || '',
    createdAt: safeUser.created_at || safeUser.createdAt,
    transactionCount: safeUser.transaction_count || 0
  };
}

const userModel = {
  findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByUsername(username) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  },

  findByEmail(email) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  },

  findByUsernameOrEmail(identifier) {
    const db = getDatabase();
    return db.prepare(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)'
    ).get(identifier, identifier);
  },

  create({ username, email, password, fullName, studentId = '', role = 'user' }) {
    const db = getDatabase();
    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const { salt, hash } = hashPassword(password);

    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, full_name, student_id, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      username.trim(),
      email.trim().toLowerCase(),
      hash,
      salt,
      fullName ? fullName.trim() : username.trim(),
      studentId ? studentId.trim() : null,
      role
    );

    return this.findById(id);
  },

  listAll() {
    const db = getDatabase();
    // Query users with their total transaction count
    const rows = db.prepare(`
      SELECT u.id, u.username, u.email, u.full_name, u.student_id, u.role, u.avatar, u.created_at,
             (SELECT COUNT(*) FROM transactions) as transaction_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    return rows.map(sanitizeUser);
  },

  updateRole(id, role) {
    const db = getDatabase();
    if (!['admin', 'user'].includes(role)) {
      throw new Error('Vai trò không hợp lệ (chỉ chấp nhận admin hoặc user)');
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    return this.findById(id);
  },

  delete(id) {
    const db = getDatabase();
    const user = this.findById(id);
    if (!user) return false;
    if (user.role === 'admin' && user.username === 'admin') {
      throw new Error('Không thể xóa tài khoản Quản trị viên hệ thống gốc');
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return true;
  },

  count() {
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(*) as total FROM users').get();
    return row ? row.total : 0;
  },

  sanitizeUser
};

module.exports = userModel;
