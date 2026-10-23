const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.resolve(__dirname);
const targetDir = 'C:\\Users\\tron\\.gemini\\antigravity\\scratch\\De_Tai_38_Quan_Ly_Chi_Tieu';
const zipScratch = 'C:\\Users\\tron\\.gemini\\antigravity\\scratch\\De_Tai_38_DTC245160020_Tran_Manh_Dung.zip';
const zipDesktop = 'C:\\Users\\tron\\Desktop\\De_Tai_38_DTC245160020_Tran_Manh_Dung.zip';

console.log('>>> Bắt đầu đóng gói Đề tài 38...');

// 1. Tạo thư mục đích
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    const base = path.basename(src);
    if (base === 'node_modules' || base === '.git' || base === '.agents' || base.endsWith('.zip')) {
      return;
    }
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(srcDir, targetDir);
console.log('✓ Đã sao chép toàn bộ mã nguồn sạch vào thư mục:', targetDir);

// 2. Nén thành file zip duy nhất
try {
  if (fs.existsSync(zipScratch)) fs.unlinkSync(zipScratch);
  if (fs.existsSync(zipDesktop)) fs.unlinkSync(zipDesktop);
  
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${targetDir}\\*' -DestinationPath '${zipScratch}' -CompressionLevel Optimal"`;
  execSync(psCmd, { stdio: 'inherit' });
  
  fs.copyFileSync(zipScratch, zipDesktop);
  
  const stats = fs.statSync(zipScratch);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✓ Đã nén thành công file ZIP duy nhất (${sizeMb} MB) tại:`);
  console.log('  1. ' + zipScratch);
  console.log('  2. ' + zipDesktop);
} catch (err) {
  console.error('Lỗi khi nén ZIP:', err.message);
}
