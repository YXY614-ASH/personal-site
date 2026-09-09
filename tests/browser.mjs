import assert from 'node:assert/strict';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build, root, routes } from '../scripts/build.mjs';
import { createSiteServer } from '../scripts/serve.mjs';
import { site, releaseLabel } from '../src/data/site.mjs';

const requireTool = createRequire(process.env.TOOL_NODE_MODULES ? path.join(process.env.TOOL_NODE_MODULES, 'tools.cjs') : import.meta.url);
const { chromium } = requireTool('playwright');
const sharp = requireTool('sharp');
process.env.SITE_BASE_PATH = '/personal-site/';
await build();
const artifacts = path.join(root, 'artifacts');
await mkdir(artifacts, { recursive: true });
const server = createSiteServer({ basePath: '/personal-site/' });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}/personal-site/`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {})
});
const report = { version: site.version, browser: browser.version(), pages: [], interactions: [], errors: [] };

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => {
    if (response.status() >= 400 && response.request().resourceType() !== 'document') report.errors.push(`Resource HTTP ${response.status()}: ${response.url()}`);
  });

  await page.goto(origin, { waitUntil: 'networkidle' });
  const heroScreenshot = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } });
  const preview = path.join(root, 'public/assets/site-preview.webp');
  await sharp(heroScreenshot).resize(1000, 625).webp({ quality: 85 }).toFile(preview);
  await copyFile(preview, path.join(root, 'dist/assets/site-preview.webp'));

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1920, height: 1080 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(origin + route.path, { waitUntil: 'networkidle' });
      await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      const check = await page.evaluate(() => {
        const visible = element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          images: [...document.images].every(image => image.complete && image.naturalWidth > 0),
          emptyLinks: [...document.querySelectorAll('a')].filter(visible).filter(a => !a.textContent.trim() && !a.getAttribute('aria-label')).length,
          textOverflow: [...document.querySelectorAll('button,h1,h2,h3')].filter(visible).filter(element => element.scrollWidth > element.clientWidth + 2).map(element => element.textContent),
          heroBottom: document.querySelector('.hero')?.getBoundingClientRect().bottom ?? null
        };
      });
      assert.equal(check.overflow, false, `Horizontal overflow: ${route.path}, ${viewport.width}`);
      assert.equal(check.images, true, `Broken image: ${route.path}, ${viewport.width}`);
      assert.equal(check.emptyLinks, 0, `Unnamed link: ${route.path}`);
      assert.deepEqual(check.textOverflow, [], `Text overflow: ${route.path}, ${viewport.width}`);
      if (check.heroBottom !== null) assert.ok(check.heroBottom < viewport.height, `Hero hides next section at ${viewport.width}`);
      if (['home', 'about', 'resume'].includes(route.active)) {
        const profile = await page.locator('main').innerText();
        assert.ok(profile.includes('本科'), `Missing education level: ${route.path}`);
        assert.ok(profile.includes('电气工程及其自动化'), `Missing major: ${route.path}`);
        for (const value of ['昆明理工大学津桥学院', '预计 2027 年毕业', '嵌入式开发', 'C 语言', 'PLC 自动化技术']) {
          assert.ok(profile.includes(value), `Missing profile content ${value}: ${route.path}`);
        }
        assert.ok(!profile.includes('教育信息待补充'), `Outdated education placeholder: ${route.path}`);
      }
      report.pages.push({ path: route.path, viewport, ...check });
      if ([1440, 390].includes(viewport.width)) await page.screenshot({ path: path.join(artifacts, `${route.path.replaceAll('/', '-').replace('.html', '')}-${viewport.width}.png`), fullPage: true });
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin);
  await page.getByRole('button', { name: '打开导航菜单' }).click();
  assert.equal(await page.locator('#mobile-nav').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobile-nav').isVisible(), false);
  await page.getByRole('button', { name: '打开导航菜单' }).click();
  await page.locator('#mobile-nav').getByRole('link', { name: '项目作品' }).click();
  await page.waitForURL('**/projects/index.html');
  report.interactions.push('Mobile navigation opens, closes with Escape and navigates correctly');

  await page.getByRole('button', { name: 'AI 应用' }).click();
  assert.equal(await page.locator('.project-card:visible').count(), 1);
  assert.equal(await page.locator('.project-card:visible').getAttribute('data-category'), 'ai');
  await page.getByRole('button', { name: 'Web 开发' }).click();
  assert.equal(await page.locator('.project-card:visible').getAttribute('data-category'), 'web');
  await page.getByRole('button', { name: '全部项目' }).click();
  assert.equal(await page.locator('.project-card:visible').count(), 2);
  report.interactions.push('All project filters and result counts');

  await page.goto(origin + 'notes/index.html');
  await page.getByRole('searchbox').fill('不存在的笔记');
  assert.equal(await page.locator('#notes-empty').isVisible(), true);
  await page.getByRole('button', { name: '重置筛选' }).click();
  assert.equal(await page.locator('[data-note]:visible').count(), 1);
  await page.getByRole('searchbox').fill('第一步');
  assert.equal(await page.locator('[data-note]:visible').count(), 1);
  await page.getByRole('button', { name: 'AI 应用', exact: true }).click();
  assert.equal(await page.locator('#notes-empty').isVisible(), true);
  await page.getByRole('button', { name: '重置筛选' }).click();
  await page.getByRole('link', { name: '从零开始，搭建个人作品集的第一步', exact: true }).click();
  await page.waitForURL('**/notes/building-v0-1/index.html');
  report.interactions.push('Note search, category filter, empty state, reset and article navigation');

  await page.goto(origin + 'resume/index.html');
  assert.equal(await page.getByRole('button', { name: '暂无可下载文件' }).isDisabled(), true);
  report.interactions.push('Resume download truthfully unavailable before a real PDF is supplied');

  const missing = await page.goto(origin + 'does/not/exist');
  assert.equal(missing.status(), 404);
  await page.getByRole('link', { name: '回到首页' }).click();
  await page.waitForURL('**/personal-site/index.html');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole('button', { name: '返回顶部' }).click();
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  report.interactions.push('Nested 404 recovery and back-to-top');

  await page.locator('.footer-bottom').getByRole('link', { name: '更新记录' }).click();
  await page.waitForURL('**/projects/personal-site/index.html#version-history');
  assert.equal(await page.locator('#version-history').isVisible(), true);
  assert.ok((await page.locator('#version-history').innerText()).includes(releaseLabel));
  report.interactions.push('Current release history link and education content across all viewports');

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(origin);
  await noJsPage.getByRole('link', { name: '探索我的项目' }).click();
  assert.equal(await noJsPage.locator('.project-card').count(), 2);
  report.interactions.push('Core content and navigation remain available without JavaScript');
  await noJs.close();
  assert.deepEqual(report.errors, [], 'Browser errors or failed resources');
  await writeFile(path.join(artifacts, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(`Browser validation passed: ${report.pages.length} page/viewport checks; ${report.interactions.length} interaction groups; zero browser errors.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
