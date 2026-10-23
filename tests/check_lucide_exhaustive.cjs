const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'client', 'src');
const lucide = require(path.resolve(__dirname, '..', 'client', 'node_modules', 'lucide-react'));

function getAllFiles(dir, extensions = ['.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extensions));
    } else {
      const ext = path.extname(fullPath);
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = getAllFiles(srcDir);
const importRegex = /import\s*\{([^};]+)\}\s*from\s*['"]lucide-react['"]/g;

const allImports = new Map();
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const iconList = match[1]
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    for (const rawIcon of iconList) {
      const cleanIcon = rawIcon.split(/\s+as\s+/)[0].trim();
      if (!cleanIcon) continue;
      if (!allImports.has(cleanIcon)) allImports.set(cleanIcon, []);
      allImports.get(cleanIcon).push(path.relative(srcDir, file));
    }
  }
});

console.log(`Audited ${files.length} source files.`);
console.log(`Found ${allImports.size} unique Lucide icon symbols imported.`);

let missing = [];
for (const [icon, fileList] of allImports.entries()) {
  if (!lucide[icon]) {
    missing.push({ icon, fileList });
  }
}

if (missing.length > 0) {
  console.error('MISSING LUCIDE ICONS FOUND:', missing);
  process.exit(1);
} else {
  console.log('✓ ALL imported Lucide icons are valid exports of lucide-react.');
}

// Check CreditCard specifically
if (allImports.has('CreditCard')) {
  console.log(`✓ CreditCard is imported and used in: ${allImports.get('CreditCard').join(', ')}`);
} else {
  console.error('✗ CreditCard is NOT imported in client/src!');
  process.exit(1);
}

// Check iconResolver.jsx
const iconResolverCode = fs.readFileSync(path.resolve(srcDir, 'utils', 'iconResolver.jsx'), 'utf-8');
const iconMapMatch = iconResolverCode.match(/export\s+const\s+ICON_MAP\s*=\s*\{([\s\S]*?)\};/);
if (!iconMapMatch) {
  console.error('✗ ICON_MAP not found in iconResolver.jsx');
  process.exit(1);
}
const iconMapKeys = iconMapMatch[1].replace(/\/\/.*$/gm, '').split(',').map(s => s.trim()).filter(Boolean);
console.log(`ICON_MAP defines ${iconMapKeys.length} registered icons.`);

if (!iconMapKeys.includes('CreditCard')) {
  console.error('✗ CreditCard is MISSING from ICON_MAP!');
  process.exit(1);
} else {
  console.log('✓ CreditCard is properly registered in ICON_MAP.');
}

// Check CategoryIconPicker.jsx
const pickerCode = fs.readFileSync(path.resolve(srcDir, 'components', 'categories', 'CategoryIconPicker.jsx'), 'utf-8');
const catIconsRegex = /icons:\s*\[([^\]]+)\]/g;
let catMatch;
const pickerIcons = new Set();
while ((catMatch = catIconsRegex.exec(pickerCode)) !== null) {
  const list = catMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  for (const ic of list) pickerIcons.add(ic);
}
console.log(`CategoryIconPicker offers ${pickerIcons.size} selectable icons.`);
if (!pickerIcons.has('CreditCard')) {
  console.error('✗ CreditCard is NOT selectable in CategoryIconPicker!');
  process.exit(1);
} else {
  console.log('✓ CreditCard is present in CategoryIconPicker selectable icons list.');
}
console.log('ALL LUCIDE ICON AUDITS PASSED WITH ZERO MISSING REFERENCES!');
