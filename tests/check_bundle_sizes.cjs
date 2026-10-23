const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const distDir = path.resolve(__dirname, '..', 'client', 'dist', 'assets');
const files = fs.readdirSync(distDir);

console.log('--------------------------------------------------------------------------------');
console.log('Asset File                     | Raw Size (KB)  | Gzip Size (KB) | Budget Limit');
console.log('--------------------------------------------------------------------------------');
files.forEach(f => {
  const p = path.join(distDir, f);
  const rawSize = fs.statSync(p).size;
  const gzSize = zlib.gzipSync(fs.readFileSync(p)).length;
  const rawKb = (rawSize / 1024).toFixed(2);
  const gzKb = (gzSize / 1024).toFixed(2);
  let budget = '-';
  if (f.startsWith('index-') && f.endsWith('.js')) {
    budget = '< 500 KB raw / < 120 KB gz';
  } else if (f.startsWith('recharts-')) {
    budget = 'Split chunk (isolated)';
  } else if (f.endsWith('.css')) {
    budget = '< 100 KB raw / < 20 KB gz';
  }
  console.log(`${f.padEnd(30)} | ${rawKb.padStart(14)} | ${gzKb.padStart(14)} | ${budget}`);
});
console.log('--------------------------------------------------------------------------------');
