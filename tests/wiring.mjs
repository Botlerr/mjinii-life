// tests/wiring.mjs — static check: every element id the code queries exists in index.html,
// and every module import path resolves on disk.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

console.log('\n[Wiring] element ids queried by JS exist in HTML');
const queried = new Set();
for (const m of html.matchAll(/\$\('([^']+)'\)/g)) queried.add(m[1]);
for (const m of html.matchAll(/getElementById\('([^']+)'\)/g)) queried.add(m[1]);
const declared = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const missing = [...queried].filter(id => !declared.has(id));
ok(`${queried.size} ids referenced, all present`, missing.length === 0, `missing: ${missing.join(', ')}`);

console.log('\n[Wiring] module import paths resolve');
const imports = [...html.matchAll(/from\s+'(\.[^']+)'/g)].map(m => m[1]);
ok(`imports found (${imports.length})`, imports.length >= 4);
for (const spec of imports) {
  ok(`${spec} exists`, existsSync(join(root, spec)), 'missing file');
}

console.log('\n[Wiring] no name declared twice in the inline module');
const inline = html.split('<script type="module">')[1]?.split('</script>')[0] || '';
const importedNames = [...inline.matchAll(/import\s*\{([^}]+)\}/g)]
  .flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()))
  .filter(Boolean);
const declaredFns = [...inline.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]);
const consts = [...inline.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=/g)].map(m => m[1]);
const clash = importedNames.filter(n => declaredFns.includes(n) || consts.includes(n));
ok('no import/local redeclaration', clash.length === 0, `clash: ${clash.join(', ')}`);

console.log('\n[Wiring] PWA files present + linked');
for (const f of ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png']) {
  ok(`${f} exists`, existsSync(join(root, f)));
}
ok('manifest linked in HTML', html.includes('rel="manifest"'));
ok('service worker registered', html.includes("serviceWorker.register('sw.js')"));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
ok('manifest icons exist on disk', manifest.icons.every(i => existsSync(join(root, i.src))));

console.log('\n[Wiring] service worker asset list resolves');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = [...sw.matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(a => a && !a.endsWith('.js'));
for (const a of assets) {
  if (a === '') continue;
  ok(`sw asset ${a}`, existsSync(join(root, a)));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
