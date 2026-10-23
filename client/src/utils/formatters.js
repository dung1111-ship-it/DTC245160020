/**
 * client/src/utils/formatters.js
 * Vietnamese Currency, Date, and Financial Math Formatters
 * 
 * Đề 38 - Triển khai và quản trị hệ thống phần mềm
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 */

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VND)
 * Ví dụ: 3500000 -> "3.500.000 ₫", -150000 -> "-150.000 ₫"
 * 
 * @param {number|string} amount - Giá trị số tiền
 * @param {object} options - Cấu hình thêm (showSign: hiển thị dấu +/-)
 * @returns {string} Chuỗi tiền tệ chuẩn VND
 */
export function formatVND(amount, options = {}) {
  const { showSign = false, symbol = '₫' } = options;

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `0 ${symbol}`;
  }

  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Phân tách hàng nghìn bằng dấu chấm chuẩn Việt Nam
  const formattedAbs = absNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (isNegative) {
    return `-${formattedAbs} ${symbol}`;
  }
  if (showSign && num > 0) {
    return `+${formattedAbs} ${symbol}`;
  }
  return `${formattedAbs} ${symbol}`;
}

/**
 * Định dạng tiền tệ thu gọn phục vụ thẻ KPI và đồ thị
 * Ví dụ: 15.500.000 -> "15,5 tr ₫", 2.300.000.000 -> "2,3 tỷ ₫", 450.000 -> "450k ₫"
 * 
 * @param {number|string} amount 
 * @returns {string}
 */
export function formatCompactVND(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 ₫';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const sign = isNegative ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace('.', ',');
    return `${sign}${val.endsWith(',0') ? val.slice(0, -2) : val} tỷ ₫`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace('.', ',');
    return `${sign}${val.endsWith(',0') ? val.slice(0, -2) : val} tr ₫`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(0);
    return `${sign}${val}k ₫`;
  }

  return formatVND(num);
}

/**
 * Định dạng ngày YYYY-MM-DD sang DD/MM/YYYY chuẩn Việt Nam
 * 
 * @param {string|Date} dateInput 
 * @returns {string} Ví dụ: "25/10/2026"
 */
export function formatDateVN(dateInput) {
  if (!dateInput) return '';
  try {
    const dStr = typeof dateInput === 'string' ? dateInput.slice(0, 10) : dateInput.toISOString().slice(0, 10);
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Định dạng ngày giờ chi tiết
 * Ví dụ: "14:30 - 25/10/2026"
 */
export function formatDateTimeVN(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} - ${formatDateVN(d)}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Định dạng tháng dạng YYYY-MM sang "Tháng MM, YYYY"
 * Ví dụ: "2026-10" -> "Tháng 10, 2026"
 */
export function formatMonthYearVN(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return '';
  const parts = monthStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    return `Tháng ${month}, ${year}`;
  }
  return monthStr;
}

/**
 * Định dạng tỷ lệ phần trăm an toàn toán học
 * Ví dụ: 46.6666 -> "46.7%", 0 -> "0.0%"
 */
export function formatPercentage(value, decimals = 1, showSign = false) {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return '0.0%';
  }
  const num = Number(value);
  const formatted = num.toFixed(decimals);
  if (showSign && num > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}

/**
 * Phân tích chuỗi tiền tệ người dùng nhập về dạng số nguyên
 * Ví dụ: "3.500.000 ₫" -> 3500000
 */
export function parseVND(input) {
  if (typeof input === 'number') return Math.round(input);
  if (!input || typeof input !== 'string') return 0;
  const cleaned = input.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Trả về thông số hiển thị badge tăng trưởng MoM (Month-over-Month)
 */
export function getGrowthBadgeProps(rate) {
  const num = Number(rate) || 0;
  if (num > 0) {
    return {
      text: `+${num.toFixed(1)}%`,
      type: 'increase',
      colorClass: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60 ring-1 ring-emerald-600/20'
    };
  }
  if (num < 0) {
    return {
      text: `${num.toFixed(1)}%`,
      type: 'decrease',
      colorClass: 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/60 ring-1 ring-rose-600/20'
    };
  }
  return {
    text: '0.0%',
    type: 'neutral',
    colorClass: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 ring-1 ring-slate-400/20'
  };
}

// Aliases for convenience across components
export const formatCurrency = formatVND;
export const formatPercent = formatPercentage;
export const formatDate = formatDateVN;
