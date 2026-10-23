/**
 * src/models/walletModel.js
 * Quản lý dữ liệu ví tài khoản và tính toán số dư động
 */

const { getDatabase } = require('../config/database');

function formatWallet(row, totalAssets = 0) {
  if (!row) return null;
  const currentBalance = row.computed_balance !== undefined ? Number(row.computed_balance) : Number(row.current_balance);
  const sharePercentage = totalAssets > 0 ? Number(((currentBalance / totalAssets) * 100).toFixed(2)) : 0;
  const inc = row.total_income !== undefined ? Number(row.total_income) : 0;
  const exp = row.total_expense !== undefined ? Number(row.total_expense) : 0;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    account_number: row.account_number || '',
    accountNumber: row.account_number || '',
    icon: row.icon,
    color: row.color,
    initial_balance: Number(row.initial_balance),
    initialBalance: Number(row.initial_balance),
    current_balance: currentBalance,
    currentBalance: currentBalance,
    incomeSum: inc,
    expenseSum: exp,
    totalIncome: inc,
    totalExpense: exp,
    transactionCount: row.transaction_count !== undefined ? Number(row.transaction_count) : 0,
    sharePercentage: sharePercentage,
    is_active: Boolean(row.is_active),
    isActive: Boolean(row.is_active),
    created_at: row.created_at,
    createdAt: row.created_at
  };
}

const walletModel = {
  getAll() {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT 
        w.*,
        (w.initial_balance + 
          COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) -
          COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0)
        ) AS computed_balance,
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) AS total_income,
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0) AS total_expense,
        (SELECT COUNT(*) FROM transactions WHERE wallet_id = w.id) AS transaction_count
      FROM wallets w
      WHERE w.is_active = 1
      ORDER BY w.created_at ASC, w.id ASC
    `).all();

    const totalAssets = rows.reduce((sum, r) => sum + (Number(r.computed_balance) || 0), 0);
    return rows.map(r => formatWallet(r, totalAssets));
  },

  getById(id) {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT 
        w.*,
        (w.initial_balance + 
          COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) -
          COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0)
        ) AS computed_balance,
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) AS total_income,
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0) AS total_expense,
        (SELECT COUNT(*) FROM transactions WHERE wallet_id = w.id) AS transaction_count
      FROM wallets w
      WHERE w.id = ?
    `).get(id);

    return formatWallet(row, 0);
  },

  create({ id, name, type, initial_balance, initialBalance, account_number, accountNumber, icon, color }) {
    const db = getDatabase();
    const walletId = id || `wal_${Date.now()}`;
    const initialBal = Number(initial_balance !== undefined ? initial_balance : (initialBalance !== undefined ? initialBalance : 0)) || 0;
    const accNum = account_number !== undefined ? account_number : (accountNumber !== undefined ? accountNumber : '');

    db.prepare(`
      INSERT INTO wallets (id, name, type, initial_balance, current_balance, account_number, icon, color, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(walletId, name, type, initialBal, initialBal, accNum, icon, color);

    this.recalculateBalances();
    return this.getById(walletId);
  },

  update(id, data) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const icon = data.icon !== undefined ? data.icon : existing.icon;
    const color = data.color !== undefined ? data.color : existing.color;
    const accountNumber = data.accountNumber !== undefined ? data.accountNumber : (data.account_number !== undefined ? data.account_number : existing.accountNumber);
    const initialBalance = data.initialBalance !== undefined ? Number(data.initialBalance) : (data.initial_balance !== undefined ? Number(data.initial_balance) : existing.initialBalance);

    db.prepare(`
      UPDATE wallets
      SET name = ?,
          icon = ?,
          color = ?,
          account_number = ?,
          initial_balance = ?
      WHERE id = ?
    `).run(name, icon, color, accountNumber, initialBalance, id);

    this.recalculateBalances();
    return this.getById(id);
  },

  hasTransactions(id) {
    const db = getDatabase();
    const count = db.prepare('SELECT count(*) as count FROM transactions WHERE wallet_id = ?').get(id).count;
    return count > 0;
  },

  delete(id) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return false;

    if (this.hasTransactions(id)) {
      const err = new Error('Không thể xóa ví đang có giao dịch phát sinh liên kết.');
      err.code = 'WALLET_IN_USE';
      err.statusCode = 400;
      throw err;
    }

    const result = db.prepare('DELETE FROM wallets WHERE id = ?').run(id);
    return result.changes > 0;
  },

  recalculateBalances() {
    const db = getDatabase();
    db.prepare(`
      UPDATE wallets SET current_balance = initial_balance + (
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = wallets.id AND type = 'income'), 0) -
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = wallets.id AND type = 'expense'), 0)
      )
    `).run();
  }
};

module.exports = walletModel;
