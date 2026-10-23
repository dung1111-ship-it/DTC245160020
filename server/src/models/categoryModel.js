/**
 * src/models/categoryModel.js
 * Quản lý dữ liệu danh mục thu / chi trong SQLite
 */

const { getDatabase } = require('../config/database');

function formatCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    is_default: Boolean(row.is_default),
    isDefault: Boolean(row.is_default),
    transactionCount: row.transaction_count !== undefined ? Number(row.transaction_count) : (row.transactionCount !== undefined ? Number(row.transactionCount) : 0),
    created_at: row.created_at,
    createdAt: row.created_at
  };
}

const categoryModel = {
  getAll(type) {
    const db = getDatabase();
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS transaction_count
      FROM categories c
    `;
    const params = [];

    if (type) {
      query += ' WHERE c.type = ?';
      params.push(type);
    }

    query += ' ORDER BY c.is_default DESC, c.name ASC';
    const rows = db.prepare(query).all(...params);
    return rows.map(formatCategory);
  },

  getById(id) {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS transaction_count
      FROM categories c
      WHERE c.id = ?
    `).get(id);
    return formatCategory(row);
  },

  create({ id, name, type, icon, color, is_default = 0 }) {
    const db = getDatabase();
    const categoryId = id || `cat_${Date.now()}`;
    db.prepare(`
      INSERT INTO categories (id, name, type, icon, color, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(categoryId, name, type, icon, color, is_default ? 1 : 0);
    return this.getById(categoryId);
  },

  update(id, { name, icon, color }) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE categories 
      SET name = COALESCE(?, name),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color)
      WHERE id = ?
    `).run(name !== undefined ? name : existing.name,
          icon !== undefined ? icon : existing.icon,
          color !== undefined ? color : existing.color,
          id);

    return this.getById(id);
  },

  hasTransactions(id) {
    const db = getDatabase();
    const count = db.prepare('SELECT count(*) as count FROM transactions WHERE category_id = ?').get(id).count;
    return count > 0;
  },

  delete(id, transferToCategoryId = null) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return false;

    if (transferToCategoryId) {
      const executeTransfer = db.transaction(() => {
        db.prepare('UPDATE transactions SET category_id = ? WHERE category_id = ?').run(transferToCategoryId, id);
        db.prepare('DELETE FROM budgets WHERE category_id = ?').run(id);
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      });
      executeTransfer();
      return true;
    }

    if (this.hasTransactions(id)) {
      const count = db.prepare('SELECT count(*) as count FROM transactions WHERE category_id = ?').get(id).count;
      const err = new Error(`Không thể xóa danh mục này vì đang có ${count} giao dịch liên kết.`);
      err.code = 'CATEGORY_IN_USE';
      err.statusCode = 400;
      throw err;
    }

    const executeDelete = db.transaction(() => {
      db.prepare('DELETE FROM budgets WHERE category_id = ?').run(id);
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    });
    executeDelete();
    return true;
  }
};

module.exports = categoryModel;
