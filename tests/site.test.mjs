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

test('no private project URLs or fabricated resume download appear in public markup', async () => {
  for (const route of routes) {
    const html = await readFile(path.join(dist, route.path), 'utf8');
    assert.ok(!html.includes(`href="${site.repository}"`));
    for (const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(link[0], /rel="noopener noreferrer"/);
  }
  const resume = await readFile(path.join(dist, 'resume/index.html'), 'utf8');
  assert.match(resume, /disabled/);
  assert.match(resume, /简历待上传/);
});

test('the chatbot project exposes its verified V0.5 capabilities without claiming a public demo', async () => {
  const html = await readFile(path.join(dist, 'projects/knowledge-agent/index.html'), 'utf8');
  for (const value of ['V0.5 Agent', 'PDF 资料问答', '题目解析卡', '学习计划卡', '课程助手 Agent', '安全计算器', '本机 Demo', '仓库当前需授权访问']) {
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
  const redirect = await fetch(`${origin}/personal-site/about`, { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/personal-site/about/');
  const missing = await fetch(`${origin}/personal-site/missing/deep/route`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /href="\/personal-site\/index.html"/);
  const post = await fetch(`${origin}/personal-site/`, { method: 'POST' });
  assert.equal(post.status, 405);
  const traversal = await fetch(`${origin}/personal-site/..%5cpackage.json`);
  assert.equal(traversal.status, 404);
});
