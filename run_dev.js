/**
 * run_dev.js - Root Full-Stack Launcher
 * Khởi động đồng thời cả Backend API (port 5000) và Frontend React Vite (port 5173)
 * 
 * Đề tài: Đề 38 - Hệ thống Quản lý Chi tiêu / Expense Tracker
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23.K1.KHMT K23A
 */

const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

console.log(`${colors.cyan}${colors.bold}======================================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN & PHÂN TÍCH TÀI CHÍNH (ĐỀ 38)     ${colors.reset}`);
console.log(`${colors.yellow}   Học phần: Triển khai và quản trị hệ thống phần mềm (Học kỳ 1 2026) ${colors.reset}`);
console.log(`${colors.green}   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020 | Lớp: K23A        ${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}======================================================================${colors.reset}\n`);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const rootDir = __dirname;
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

// 1. Start Backend Express Server
console.log(`${colors.blue}[SYSTEM] Đang khởi động Backend Server (Node.js/Express + SQLite)...${colors.reset}`);
const serverProcess = spawn('node', ['server.js'], {
  cwd: serverDir,
  stdio: 'pipe',
  shell: isWindows
});

serverProcess.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    console.log(`${colors.blue}[BACKEND]${colors.reset} ${line}`);
  });
});

serverProcess.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    console.log(`${colors.red}[BACKEND ERR]${colors.reset} ${line}`);
  });
});

// 2. Start Frontend React Vite App
console.log(`${colors.magenta}[SYSTEM] Đang khởi động Frontend (React + Vite + Tailwind CSS)...${colors.reset}`);
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'pipe',
  shell: isWindows
});

clientProcess.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    console.log(`${colors.magenta}[FRONTEND]${colors.reset} ${line}`);
  });
});

clientProcess.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    console.log(`${colors.yellow}[FRONTEND MSG]${colors.reset} ${line}`);
  });
});

// Handle graceful exit
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}[SYSTEM] Đang dừng toàn bộ dịch vụ...${colors.reset}`);
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});

console.log(`${colors.green}${colors.bold}>>> DỰ ÁN ĐÃ SẴN SÀNG! Mở trình duyệt tại: http://localhost:3000 <<<${colors.reset}\n`);

// Tự động mở trình duyệt sau 1.5 giây
setTimeout(() => {
  const openCmd = isWindows ? 'start http://localhost:3000' : 'open http://localhost:3000';
  spawn(openCmd, { shell: true });
}, 1500);
