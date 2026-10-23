/**
 * tests/challenger_frontend_stress.mjs
 * 
 * EMPIRICAL CHALLENGER TEST HARNESS: FRONTEND BUILD & TOOLCHAIN
 * 
 * Môn học: Triển khai và quản trị hệ thống phần mềm (Đề 38)
 * Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
 * 
 * Tests:
 * 1. Vite Build Artifacts Integrity & Bundle Budgets
 * 2. Lucide React Icons Exhaustive Audit & Runtime Safety
 * 3. Local Import Graph Resolution (Zero Broken Imports)
 * 4. Responsive Viewports & Tailwind CSS Media Queries
 * 5. Asset Serving & SPA Fallback HTTP Simulation
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import zlib from 'zlib';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_DIR = path.resolve(ROOT_DIR, 'client');
const DIST_DIR = path.resolve(CLIENT_DIR, 'dist');
const SRC_DIR = path.resolve(CLIENT_DIR, 'src');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    const errMsg = `  ✗ FAIL: ${testName} - ${details}`;
    console.error(errMsg);
    failures.push({ testName, details });
  }
}

// Helper to calculate gzip size
function getGzipSize(filePath) {
  const fileContent = fs.readFileSync(filePath);
  return zlib.gzipSync(fileContent).length;
}

// Helper to recursively collect all files in a directory
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

// -----------------------------------------------------------------------------
// SUITE 1: Vite Build Artifacts Integrity & Bundle Budgets
// -----------------------------------------------------------------------------
async function runSuite1() {
  console.log('\n================================================================================');
  console.log('[SUITE 1] VITE BUILD ARTIFACTS INTEGRITY & BUNDLE BUDGETS');
  console.log('================================================================================');

  const indexPath = path.resolve(DIST_DIR, 'index.html');
  assert(fs.existsSync(indexPath), 'dist/index.html exists', `Path: ${indexPath}`);
  
  if (!fs.existsSync(indexPath)) return;

  const indexHtml = fs.readFileSync(indexPath, 'utf-8');
  assert(indexHtml.length > 500, 'dist/index.html is non-trivial (>500 bytes)', `Actual size: ${indexHtml.length} bytes`);
  assert(indexHtml.includes('<div id="root"></div>'), 'dist/index.html contains root container <div id="root"></div>');
  assert(indexHtml.includes('name="viewport"'), 'dist/index.html contains viewport meta tag');
  assert(indexHtml.includes('Trần Mạnh Dũng') || indexHtml.includes('DTC245160020') || indexHtml.includes('Đề 38'), 
    'dist/index.html contains Student / Exam Branding metadata');

  // Extract JS script tags
  const jsMatch = indexHtml.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
  assert(Boolean(jsMatch && jsMatch[1]), 'dist/index.html references module JS bundle');
  
  // Extract CSS link tags
  const cssMatch = indexHtml.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
  assert(Boolean(cssMatch && cssMatch[1]), 'dist/index.html references CSS stylesheet bundle');

  if (jsMatch && jsMatch[1]) {
    const jsRel = jsMatch[1].replace(/^\//, '');
    const jsPath = path.resolve(DIST_DIR, jsRel);
    assert(fs.existsSync(jsPath), `Referenced JS asset exists on disk (${jsRel})`);

    const jsSize = fs.statSync(jsPath).size;
    const jsGzip = getGzipSize(jsPath);
    console.log(`    -> JS Bundle: ${(jsSize / 1024).toFixed(2)} KB (Gzip: ${(jsGzip / 1024).toFixed(2)} KB)`);
    assert(jsSize < 500 * 1024, 'JS bundle size < 500 KB uncompressed', `Actual: ${(jsSize / 1024).toFixed(2)} KB`);
    assert(jsGzip < 120 * 1024, 'JS bundle size < 120 KB gzipped', `Actual: ${(jsGzip / 1024).toFixed(2)} KB`);
  }

  if (cssMatch && cssMatch[1]) {
    const cssRel = cssMatch[1].replace(/^\//, '');
    const cssPath = path.resolve(DIST_DIR, cssRel);
    assert(fs.existsSync(cssPath), `Referenced CSS asset exists on disk (${cssRel})`);

    const cssSize = fs.statSync(cssPath).size;
    const cssGzip = getGzipSize(cssPath);
    console.log(`    -> CSS Bundle: ${(cssSize / 1024).toFixed(2)} KB (Gzip: ${(cssGzip / 1024).toFixed(2)} KB)`);
    assert(cssSize < 100 * 1024, 'CSS bundle size < 100 KB uncompressed', `Actual: ${(cssSize / 1024).toFixed(2)} KB`);
    assert(cssGzip < 20 * 1024, 'CSS bundle size < 20 KB gzipped', `Actual: ${(cssGzip / 1024).toFixed(2)} KB`);
  }
}

// -----------------------------------------------------------------------------
// SUITE 2: Lucide React Icons Exhaustive Audit & Runtime Safety
// -----------------------------------------------------------------------------
async function runSuite2() {
  console.log('\n================================================================================');
  console.log('[SUITE 2] LUCIDE REACT ICONS EXHAUSTIVE AUDIT & RUNTIME SAFETY');
  console.log('================================================================================');

  // Load lucide-react dynamically from client/node_modules via pathToFileURL
  let lucideReact = null;
  const cjsPath = path.resolve(CLIENT_DIR, 'node_modules', 'lucide-react', 'dist', 'cjs', 'lucide-react.js');
  try {
    lucideReact = await import(pathToFileURL(cjsPath).href);
  } catch (err) {
    console.error('Failed to import lucide-react:', err);
  }

  assert(Boolean(lucideReact), 'Successfully loaded lucide-react module');

  // 2.1 Scan all JSX/JS files in client/src for lucide-react imports
  const allClientFiles = getAllFiles(SRC_DIR, ['.js', '.jsx']);
  const importedLucideIcons = new Map(); // iconName -> Array of files

  // Exact regex matching import { ... } from 'lucide-react' without crossing statements
  const importRegex = /import\s*\{([^};]+)\}\s*from\s*['"]lucide-react['"]/g;

  for (const filePath of allClientFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const iconList = match[1]
        .replace(/\/\/.*$/gm, '') // remove line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      for (const rawIcon of iconList) {
        const cleanIcon = rawIcon.split(/\s+as\s+/)[0].trim();
        if (!cleanIcon) continue;
        if (!importedLucideIcons.has(cleanIcon)) {
          importedLucideIcons.set(cleanIcon, []);
        }
        importedLucideIcons.get(cleanIcon).push(path.relative(CLIENT_DIR, filePath));
      }
    }
  }

  console.log(`  [INFO] Found ${importedLucideIcons.size} distinct Lucide icons imported across ${allClientFiles.length} source files.`);

  // Verify each icon exists in lucide-react
  let missingIconsCount = 0;
  for (const [iconName, files] of importedLucideIcons.entries()) {
    const exists = lucideReact && Boolean(lucideReact[iconName]);
    if (!exists) {
      missingIconsCount++;
      assert(false, `Lucide icon '${iconName}' exists`, `Used in: ${files.join(', ')}`);
    }
  }
  if (missingIconsCount === 0) {
    assert(true, `All ${importedLucideIcons.size} imported Lucide icons exist in lucide-react`);
  }

  // 2.2 Verify iconResolver.jsx ICON_MAP
  const resolverContent = fs.readFileSync(path.resolve(SRC_DIR, 'utils', 'iconResolver.jsx'), 'utf-8');
  
  // Extract ICON_MAP keys
  const iconMapMatch = resolverContent.match(/export\s+const\s+ICON_MAP\s*=\s*\{([\s\S]*?)\};/);
  assert(Boolean(iconMapMatch), 'iconResolver.jsx defines and exports ICON_MAP');

  const iconMapKeys = [];
  if (iconMapMatch) {
    const rawKeys = iconMapMatch[1]
      .replace(/\/\/.*$/gm, '') // strip comments
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    iconMapKeys.push(...rawKeys);
    console.log(`  [INFO] ICON_MAP contains ${iconMapKeys.length} registered icons.`);

    let invalidMapKeys = 0;
    for (const key of iconMapKeys) {
      if (!lucideReact || !lucideReact[key]) {
        invalidMapKeys++;
        assert(false, `ICON_MAP entry '${key}' is a valid Lucide component`);
      }
    }
    if (invalidMapKeys === 0) {
      assert(true, `All ${iconMapKeys.length} entries in ICON_MAP are valid Lucide components`);
    }
  }

  // 2.3 Verify CategoryIconPicker.jsx CATEGORIZED_ICONS
  const pickerContent = fs.readFileSync(path.resolve(SRC_DIR, 'components', 'categories', 'CategoryIconPicker.jsx'), 'utf-8');
  const catIconsRegex = /icons:\s*\[([^\]]+)\]/g;
  let catMatch;
  const pickerIcons = new Set();
  while ((catMatch = catIconsRegex.exec(pickerContent)) !== null) {
    const list = catMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
    for (const icon of list) {
      pickerIcons.add(icon);
    }
  }

  console.log(`  [INFO] CategoryIconPicker offers ${pickerIcons.size} distinct selectable icons.`);
  let unmappedPickerIcons = 0;
  for (const icon of pickerIcons) {
    const inIconMap = iconMapKeys.includes(icon);
    if (!inIconMap) {
      unmappedPickerIcons++;
      assert(false, `CategoryIconPicker icon '${icon}' exists in ICON_MAP`, 
        `Picker offers '${icon}', but ICON_MAP lacks it! It will render blank or fallback.`);
    }
  }
  if (unmappedPickerIcons === 0) {
    assert(true, `All ${pickerIcons.size} icons in CategoryIconPicker exist in ICON_MAP`);
  }

  // 2.4 Test CategoryIcon Fallback Robustness (Simulated AST / Logic check)
  assert(resolverContent.includes('const IconComponent = ICON_MAP[name] || Folder;'), 
    'CategoryIcon has fallback to Folder component when icon is missing');
  assert(resolverContent.includes('export function WalletIcon({ walletId'), 
    'WalletIcon component is defined and handles walletId');
  assert(resolverContent.includes('default:\n      return <Wallet') || resolverContent.includes('default:'), 
    'WalletIcon has default fallback case for unrecognized walletId');
}

// -----------------------------------------------------------------------------
// SUITE 3: Local Import Resolution & Module Graph Verification
// -----------------------------------------------------------------------------
async function runSuite3() {
  console.log('\n================================================================================');
  console.log('[SUITE 3] LOCAL IMPORT GRAPH RESOLUTION (ZERO BROKEN IMPORTS)');
  console.log('================================================================================');

  const allSourceFiles = getAllFiles(SRC_DIR, ['.js', '.jsx']);
  let totalRelativeImports = 0;
  let brokenImports = 0;

  const relativeImportRegex = /from\s+['"](\.[^'"]+)['"]/g;

  for (const filePath of allSourceFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;
    while ((match = relativeImportRegex.exec(content)) !== null) {
      totalRelativeImports++;
      const relPath = match[1];
      const dirOfFile = path.dirname(filePath);

      // Try resolving candidates: exact, .js, .jsx, .json, .css, /index.js, /index.jsx
      const candidates = [
        path.resolve(dirOfFile, relPath),
        path.resolve(dirOfFile, `${relPath}.js`),
        path.resolve(dirOfFile, `${relPath}.jsx`),
        path.resolve(dirOfFile, `${relPath}.json`),
        path.resolve(dirOfFile, `${relPath}.css`),
        path.resolve(dirOfFile, relPath, 'index.js'),
        path.resolve(dirOfFile, relPath, 'index.jsx')
      ];

      const resolved = candidates.some(cand => fs.existsSync(cand) && fs.statSync(cand).isFile());
      if (!resolved) {
        brokenImports++;
        assert(false, `Broken import '${relPath}' in ${path.relative(ROOT_DIR, filePath)}`);
      }
    }
  }

  assert(brokenImports === 0, `All ${totalRelativeImports} relative imports resolve cleanly to existing files`, 
    `Broken: ${brokenImports}`);
}

// -----------------------------------------------------------------------------
// SUITE 4: Responsive Viewport & Tailwind Styling Verification
// -----------------------------------------------------------------------------
async function runSuite4() {
  console.log('\n================================================================================');
  console.log('[SUITE 4] RESPONSIVE VIEWPORT & TAILWIND CSS MEDIA QUERIES');
  console.log('================================================================================');

  // 4.1 Inspect compiled CSS for responsive media query rules
  const distAssets = fs.readdirSync(path.resolve(DIST_DIR, 'assets'));
  const cssFile = distAssets.find(f => f.endsWith('.css'));
  assert(Boolean(cssFile), `Compiled CSS asset found in dist/assets (${cssFile})`);

  if (cssFile) {
    const cssContent = fs.readFileSync(path.resolve(DIST_DIR, 'assets', cssFile), 'utf-8');
    
    // Check for Tailwind standard breakpoints in compiled CSS
    assert(cssContent.includes('@media (min-width: 640px)') || cssContent.includes('@media (min-width:640px)'), 
      'Compiled CSS includes sm: breakpoint (@media min-width: 640px)');
    assert(cssContent.includes('@media (min-width: 768px)') || cssContent.includes('@media (min-width:768px)'), 
      'Compiled CSS includes md: breakpoint (@media min-width: 768px)');
    assert(cssContent.includes('@media (min-width: 1024px)') || cssContent.includes('@media (min-width:1024px)'), 
      'Compiled CSS includes lg: breakpoint (@media min-width: 1024px)');

    // Check for Dark Mode classes
    assert(cssContent.includes('.dark'), 'Compiled CSS includes dark mode rules (.dark selector)');

    // Check custom color tokens
    assert(cssContent.includes('#6366f1') || cssContent.includes('99 102 241') || cssContent.includes('rgb(99, 102, 241)'), 
      'Compiled CSS includes brand color palette tokens');
  }

  // 4.2 Inspect responsive layout classes in key components
  const kpiContent = fs.readFileSync(path.resolve(SRC_DIR, 'components', 'dashboard', 'KPICards.jsx'), 'utf-8');
  assert(kpiContent.includes('grid-cols-1') && kpiContent.includes('sm:grid-cols-2') && kpiContent.includes('lg:grid-cols-4'),
    'KPICards uses responsive 1 -> 2 -> 4 column layout (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)');

  const walletContent = fs.readFileSync(path.resolve(SRC_DIR, 'components', 'dashboard', 'WalletCards.jsx'), 'utf-8');
  assert(walletContent.includes('grid-cols-1') && walletContent.includes('md:grid-cols-3'),
    'WalletCards uses responsive 1 -> 3 column layout (grid-cols-1 md:grid-cols-3)');

  const navbarContent = fs.readFileSync(path.resolve(SRC_DIR, 'components', 'layout', 'Navbar.jsx'), 'utf-8');
  assert(navbarContent.includes('hidden md:flex') || navbarContent.includes('md:flex'),
    'Navbar uses responsive desktop flex tabs and hidden on mobile');
  assert(navbarContent.includes('fixed inset-y-0') || navbarContent.includes('fixed inset-0'),
    'Navbar implements responsive mobile drawer slide-out');

  const tableContent = fs.readFileSync(path.resolve(SRC_DIR, 'components', 'transactions', 'TransactionTable.jsx'), 'utf-8');
  assert(tableContent.includes('hidden md:block') || tableContent.includes('md:table') || tableContent.includes('overflow-x-auto') || tableContent.includes('block md:hidden'),
    'TransactionTable handles mobile responsiveness via responsive table display or overflow scrolling');
}

// -----------------------------------------------------------------------------
// SUITE 5: Asset Serving & SPA Fallback HTTP Simulation
// -----------------------------------------------------------------------------
async function runSuite5() {
  console.log('\n================================================================================');
  console.log('[SUITE 5] ASSET SERVING & SPA FALLBACK HTTP SIMULATION');
  console.log('================================================================================');

  const PORT = 3888;
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.resolve(DIST_DIR, reqUrl.replace(/^\//, ''));

    if (reqUrl === '/') {
      filePath = path.resolve(DIST_DIR, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback: return index.html for non-asset routes
    if (!reqUrl.startsWith('/assets/')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(path.resolve(DIST_DIR, 'index.html')).pipe(res);
      return;
    }

    // 404 for missing assets
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Asset Not Found');
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`  [INFO] Simulation preview server listening on http://localhost:${PORT}`);

  // Helper for HTTP requests
  function httpGet(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            data: buffer.toString('utf-8'),
            byteLength: buffer.length
          });
        });
      }).on('error', reject);
    });
  }

  try {
    // Test 5.1: Root GET /
    const rootRes = await httpGet('/');
    assert(rootRes.statusCode === 200, 'GET / returns 200 OK');
    assert(rootRes.headers['content-type'].includes('text/html'), 'GET / Content-Type is text/html');
    assert(rootRes.data.includes('<div id="root">'), 'GET / response includes root element');

    // Test 5.2: Bundled JS asset
    const distAssets = fs.readdirSync(path.resolve(DIST_DIR, 'assets'));
    const jsFile = distAssets.find(f => f.endsWith('.js'));
    if (jsFile) {
      const jsRes = await httpGet(`/assets/${jsFile}`);
      assert(jsRes.statusCode === 200, `GET /assets/${jsFile} returns 200 OK`);
      assert(jsRes.headers['content-type'].includes('javascript'), 'JS Asset Content-Type is application/javascript');
      const expectedSize = fs.statSync(path.resolve(DIST_DIR, 'assets', jsFile)).size;
      assert(jsRes.byteLength === expectedSize, 'Served JS asset byte length matches physical file', 
        `Got: ${jsRes.byteLength}, Expected: ${expectedSize}`);
    }

    // Test 5.3: Bundled CSS asset
    const cssFile = distAssets.find(f => f.endsWith('.css'));
    if (cssFile) {
      const cssRes = await httpGet(`/assets/${cssFile}`);
      assert(cssRes.statusCode === 200, `GET /assets/${cssFile} returns 200 OK`);
      assert(cssRes.headers['content-type'].includes('css'), 'CSS Asset Content-Type is text/css');
      const expectedSize = fs.statSync(path.resolve(DIST_DIR, 'assets', cssFile)).size;
      assert(cssRes.byteLength === expectedSize, 'Served CSS asset byte length matches physical file',
        `Got: ${cssRes.byteLength}, Expected: ${expectedSize}`);
    }

    // Test 5.4: Missing asset returns 404
    const notFoundRes = await httpGet('/assets/non_existent_bundle.js');
    assert(notFoundRes.statusCode === 404, 'GET /assets/non_existent_bundle.js returns 404');

    // Test 5.5: SPA Fallback routing for frontend paths
    const spaRes = await httpGet('/transactions');
    assert(spaRes.statusCode === 200, 'GET /transactions returns 200 (SPA Fallback)');
    assert(spaRes.data.includes('<div id="root">'), 'SPA route serves index.html');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log(`  [INFO] Simulation preview server stopped cleanly.`);
  }
}

// -----------------------------------------------------------------------------
// MAIN TEST RUNNER
// -----------------------------------------------------------------------------
async function runAll() {
  console.log('================================================================================');
  console.log('   EMPIRICAL CHALLENGER TEST SUITE: FRONTEND BUILD & TOOLCHAIN');
  console.log('   Đề 38: Quản lý Chi tiêu Cá nhân & Phân tích Tài chính');
  console.log('   Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020');
  console.log('================================================================================');

  try {
    await runSuite1();
    await runSuite2();
    await runSuite3();
    await runSuite4();
    await runSuite5();
  } catch (err) {
    console.error('UNEXPECTED EXCEPTION DURING SUITE EXECUTION:', err);
    failedTests++;
    failures.push({ testName: 'Suite Execution', details: err.message });
  }

  console.log('\n================================================================================');
  console.log('CHALLENGER SUITE EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log(` Total Checks Executed : ${totalTests}`);
  console.log(` Passed Checks         : ${passedTests}`);
  console.log(` Failed Checks         : ${failedTests}`);
  console.log(` Success Rate          : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('--------------------------------------------------------------------------------');

  if (failedTests > 0) {
    console.error(` Verdict: [CHALLENGE_FAILED] - ${failedTests} failure(s) detected:`);
    for (const f of failures) {
      console.error(`   - ${f.testName}: ${f.details}`);
    }
    process.exit(1);
  } else {
    console.log(' Verdict: [APPROVE] - All frontend toolchain stress tests PASSED with zero defects.');
    process.exit(0);
  }
}

runAll();
