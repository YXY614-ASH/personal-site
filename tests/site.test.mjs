import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { root, routes } from '../scripts/build.mjs';
import { createSiteServer } from '../scripts/serve.mjs';
import { escapeHtml } from '../src/components/layout.mjs';
import { site, releaseLabel } from '../src/data/site.mjs';

const dist = path.join(root, 'dist');

test('package, build metadata, page footers and project status agree on the release', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const buildInfo = JSON.parse(await readFile(path.join(dist, 'build-info.json'), 'utf8'));
  assert.equal(site.version, pkg.version);
  assert.equal(releaseLabel, `V${pkg.version.replace(/\.0$/, '')}`);
  assert.equal(buildInfo.version, pkg.version);
  for (const route of routes) {
    const html = await readFile(path.join(dist, route.path), 'utf8');
    assert.ok(html.includes(`<span class="footer-version">${releaseLabel}</span>`), route.path);
  }
  assert.equal(site.projects.find(project => project.id === 'personal-site').status, `${releaseLabel} 已实现`);
});

test('all pages have unique titles, a single heading, Chinese metadata and no incomplete links', async () => {
  const titles = new Set();
  for (const route of routes) {
    const html = await readFile(path.join(dist, route.path), 'utf8');
    assert.match(html, /<html lang="zh-CN">/);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, route.path);
    assert.match(html, /name="viewport"/);
    assert.match(html, /name="description"/);
    assert.ok(!html.includes('href="#"'), route.path);
    assert.ok(!html.includes('href="javascript:'), route.path);
    assert.match(html, /吴佳诣/);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title), title);
    titles.add(title);
  }
});

test('every internal page, script, image and stylesheet reference resolves in the build', async () => {
  for (const route of routes) {
    const filename = path.join(dist, route.path);
    const html = await readFile(filename, 'utf8');
    for (const [, reference] of html.matchAll(/<(?:a|link|script|img)\b[^>]*?(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|#)/.test(reference)) continue;
      const target = path.resolve(path.dirname(filename), reference.split('#')[0]);
      assert.ok(target.startsWith(dist + path.sep), `${route.path}: ${reference}`);
      await access(target);
      const fragment = reference.split('#')[1];
      if (fragment) {
        const targetHtml = await readFile(target, 'utf8');
        assert.ok(targetHtml.includes(`id="${fragment}"`), `${route.path}: missing anchor ${reference}`);
      }
    }
    for (const [, icon] of html.matchAll(/<use href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${icon}"`), `${route.path}: ${icon}`);
    }
  }
});

test('public source links are available and external links remain safe without inventing a resume download', async () => {
  for (const route of routes) {
    const html = await readFile(path.join(dist, route.path), 'utf8');
    assert.ok(!html.includes('仓库当前需授权访问'));
    assert.ok(!html.includes('源码仓库暂未公开'));
    for (const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(link[0], /rel="noopener noreferrer"/);
  }
  assert.equal(site.repositoryPublic, true);
  for (const project of site.projects) {
    for (const route of ['index.html', 'projects/index.html', project.path]) {
      const html = await readFile(path.join(dist, route), 'utf8');
      assert.ok(html.includes(`href="${project.source}"`), `${route}: ${project.source}`);
    }
  }
  const resume = await readFile(path.join(dist, 'resume/index.html'), 'utf8');
  assert.match(resume, /disabled/);
  assert.match(resume, /简历待上传/);
});

test('the chatbot project exposes its verified V0.5 capabilities without claiming a public demo', async () => {
  const html = await readFile(path.join(dist, 'projects/knowledge-agent/index.html'), 'utf8');
  for (const value of ['V0.5 Agent', 'PDF 资料问答', '题目解析卡', '学习计划卡', '课程助手 Agent', '安全计算器', '本机 Demo', '公开源码仓库']) {
    assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.ok(html.includes('href="http://127.0.0.1:7861/"'));
  assert.ok(html.includes('href="https://github.com/YXY614-ASH/chatbot"'));
});

test('the homepage explains the chatbot project beyond its card summary', async () => {
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  for (const section of ['项目介绍', '技术栈', '迭代过程', '核心亮点', '解决问题', '工程思路']) {
    assert.match(html, new RegExp(`<h3>${section}</h3>`));
  }
  assert.match(html, /V0\.3/);
  assert.match(html, /V0\.5/);
  assert.ok(html.includes('href="http://127.0.0.1:7861/"'));
});

test('image assets and JavaScript stay within the initial performance budget', async () => {
  assert.ok((await stat(path.join(dist, 'assets/workspace.webp'))).size < 600_000);
  assert.ok((await stat(path.join(dist, 'assets/site-preview.webp'))).size < 250_000);
  assert.ok((await stat(path.join(dist, 'assets/app.js'))).size < 15_000);
  assert.ok((await stat(path.join(dist, 'assets/styles.css'))).size < 50_000);
  const original = (await stat(path.join(dist, 'assets/workspace.webp'))).size;
  for (const variant of ['workspace-mobile.webp', 'workspace-1280.webp']) {
    assert.ok((await stat(path.join(dist, 'assets', variant))).size < original * 0.75);
  }
});

test('every note generates an article and valid section anchors from its content', async () => {
  assert.equal(new Set(site.notes.map(note => note.slug)).size, site.notes.length);
  for (const note of site.notes) {
    const html = await readFile(path.join(dist, note.path), 'utf8');
    assert.ok(html.includes(escapeHtml(note.title)));
    assert.equal(new Set(note.sections.map(section => section.id)).size, note.sections.length);
    for (const section of note.sections) {
      assert.ok(html.includes(`href="#${section.id}"`));
      assert.ok(html.includes(`id="${section.id}"`));
      assert.ok(section.paragraphs.length > 0);
    }
  }
});

test('HTML escaping handles markup characters', () => {
  assert.equal(escapeHtml('<script>"a" & \'b\'</script>'), '&lt;script&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/script&gt;');
});

test('HTTP routes, subdirectory hosting, missing routes and non-GET requests respond correctly', async t => {
  const server = createSiteServer({ basePath: '/personal-site/' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const route of routes) {
    const response = await fetch(`${origin}/personal-site/${route.path}`);
    assert.equal(response.status, 200, route.path);
    assert.match(response.headers.get('content-type'), /text\/html/);
  }
  const redirect = await fetch(`${origin}/personal-site/notes?q=PDF&sort=oldest`, { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/personal-site/notes/?q=PDF&sort=oldest');
  const missing = await fetch(`${origin}/personal-site/missing/deep/route`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /href="\/personal-site\/index.html"/);
  const post = await fetch(`${origin}/personal-site/`, { method: 'POST' });
  assert.equal(post.status, 405);
  const traversal = await fetch(`${origin}/personal-site/..%5cpackage.json`);
  assert.equal(traversal.status, 404);
  for (const route of ['%E0%A4%A', 'notes/%00', '不存在的页面']) {
    assert.equal((await fetch(`${origin}/personal-site/${route}`)).status, 404);
  }
});

test('local delivery supports compression, conditional requests and HEAD without compressing images', async t => {
  const server = createSiteServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const identity = await fetch(origin, { headers: { 'Accept-Encoding': 'gzip;q=0, identity' } });
  assert.equal(identity.headers.get('content-encoding'), null);
  const compressed = await fetch(origin, { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(compressed.headers.get('content-encoding'), 'gzip');
  assert.ok(Number(compressed.headers.get('content-length')) < Number(identity.headers.get('content-length')) * 0.5);
  assert.equal(await compressed.text(), await identity.text());
  const cached = await fetch(origin, { headers: { 'Accept-Encoding': 'gzip', 'If-None-Match': compressed.headers.get('etag') } });
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), '');
  const head = await fetch(origin, { method: 'HEAD', headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), compressed.headers.get('content-length'));
  assert.equal(await head.text(), '');
  const image = await fetch(`${origin}/assets/workspace-mobile.webp`);
  assert.equal(image.headers.get('content-encoding'), null);
});

test('missing build output returns a recoverable response without terminating the server', async t => {
  const server = createSiteServer({ directory: path.join(root, 'artifacts', 'missing-build-output') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}`, { method });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('retry-after'), '3');
    if (method === 'HEAD') assert.equal(await response.text(), '');
  }
});
