// Confere o build: todo link interno aponta para uma página gerada e nenhuma página fica órfã.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === 'index.html') files.push(p);
  }
})(DIST);

const routes = new Set(files.map((f) => '/' + f.slice(DIST.length).replace(/index\.html$/, '')));
const incoming = new Map([...routes].map((r) => [r, 0]));
const broken = [];
for (const f of files) {
  const from = '/' + f.slice(DIST.length).replace(/index\.html$/, '');
  for (const [, href] of readFileSync(f, 'utf8').matchAll(/href="(\/[^"#?]*)"/g)) {
    if (/\.(svg|css|js|xml|txt)$/.test(href) || href.startsWith('/_astro/')) continue;
    if (!routes.has(href)) broken.push(`${from} -> ${href}`);
    else if (href !== from) incoming.set(href, incoming.get(href) + 1);
  }
}
const orphans = [...incoming].filter(([r, n]) => r !== '/' && n === 0).map(([r]) => r);
console.log(`Páginas: ${routes.size}`);
console.log(`Links quebrados: ${broken.length}`);
broken.slice(0, 20).forEach((b) => console.log('  ' + b));
console.log(`Páginas órfãs: ${orphans.length}`);
orphans.forEach((o) => console.log('  ' + o));
process.exit(broken.length ? 1 : 0);
