import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes, root } from './build.mjs';
import { site } from '../src/data/site.mjs';

const dist = path.join(root, 'dist');
const sourceRoots = ['src', 'scripts', 'public', '.github', 'vercel.json'];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:sk|pk)-[A-Za-z0-9_-]{20,}/,
  /(?:api[_-]?key|token|secret)\s*[:=]\s*['"][^$\r\n]{16,}['"]/i
];

async function filesAt(target) {
  const info = await readdir(target, { withFileTypes: true });
  const files = [];
  for (const entry of info) {
    const filename = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...await filesAt(filename));
    else files.push(filename);
  }
  return files;
}

const sourceFiles = [];
for (const relative of sourceRoots) {
  const target = path.join(root, relative);
  try {
    const stat = await import('node:fs/promises').then(fs => fs.stat(target));
    sourceFiles.push(...(stat.isDirectory() ? await filesAt(target) : [target]));
  } catch {
    throw new Error(`Release audit target is missing: ${relative}`);
  }
}

for (const filename of sourceFiles) {
  const text = await readFile(filename, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) throw new Error(`Possible credential in ${path.relative(root, filename)}`);
  }
}

const requiredFiles = ['site.webmanifest', 'robots.txt', 'assets/favicon.svg', 'assets/icons.svg', 'assets/styles.css', 'assets/app.js'];
for (const relative of requiredFiles) await access(path.join(dist, relative));
const pages = await Promise.all(routes.map(route => readFile(path.join(dist, route.path), 'utf8')));
const titles = new Set();
for (const [index, html] of pages.entries()) {
  const route = routes[index];
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title || titles.has(title)) throw new Error(`Duplicate or missing title: ${route.path}`);
  titles.add(title);
  if (!html.includes('<meta name="author"')) throw new Error(`Missing author metadata: ${route.path}`);
  if (!html.includes('<link rel="canonical"')) throw new Error(`Missing canonical metadata: ${route.path}`);
  if (!html.includes('rel="manifest"')) throw new Error(`Missing manifest link: ${route.path}`);
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="noopener noreferrer"/.test(match[0])) throw new Error(`Unsafe external link: ${route.path}`);
  }
}
if (site.version !== JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version) throw new Error('Version mismatch');
console.log(`Release audit passed: ${routes.length} pages, ${sourceFiles.length} source files, no embedded credentials.`);
