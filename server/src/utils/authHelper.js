/**
 * server/src/utils/authHelper.js
 * Tiện ích mã hóa mật khẩu & JSON Web Token chuẩn bảo mật
 * Sử dụng thư viện crypto tiêu chuẩn của Node.js (Zero external dependency)
 * 
 * Đề 38 - Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

const crypto = require('crypto');
const env = require('../config/env');

const JWT_SECRET = process.env.JWT_SECRET || 'ExpenseTracker_Secret_Key_DTC245160020_2026';
const ITERATIONS = 10000;
const KEYLEN = 64;
const DIGEST = 'sha512';

/**
 * Mã hóa mật khẩu với Salt ngẫu nhiên bằng thuật toán PBKDF2
 * @param {string} password 
 * @returns {{ salt: string, hash: string }}
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { salt, hash };
}

/**
 * Xác thực mật khẩu
 * @param {string} password Mật khẩu người dùng nhập
 * @param {string} salt Salt đã lưu trong CSDL
 * @param {string} storedHash Hash đã lưu trong CSDL
 * @returns {boolean}
 */
function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Mã hóa Base64 URL an toàn
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Giải mã Base64 URL
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Tạo JSON Web Token (JWT) có ký số HMAC-SHA256
 * @param {object} payload 
 * @param {number} expiresInSeconds Thời hạn (mặc định 7 ngày = 604800s)
 * @returns {string} Token dạng header.payload.signature
 */
function generateToken(payload, expiresInSeconds = 604800) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000)
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Xác minh tính hợp lệ và giải mã JWT
 * @param {string} token 
 * @returns {object|null} Payload nếu hợp lệ, null nếu giả mạo hoặc hết hạn
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Tính lại chữ ký
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    return null; // Chữ ký không khớp, token bị sửa đổi
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Token đã hết hạn
    }

    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};
