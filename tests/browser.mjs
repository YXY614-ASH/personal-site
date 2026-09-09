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
  const preview = path.join(artifacts, 'site-preview.webp');
  await sharp(heroScreenshot).resize(1000, 625).webp({ quality: 85 }).toFile(preview);
  if (process.env.UPDATE_PREVIEW === '1') {
    await copyFile(preview, path.join(root, 'public/assets/site-preview.webp'));
    await copyFile(preview, path.join(root, 'dist/assets/site-preview.webp'));
  }

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1920, height: 1080 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(origin + route.path, { waitUntil: 'networkidle' });
      await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await page.evaluate(() => document.fonts.ready);
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
      if (route.active === 'home') {
        assert.equal(await page.locator('#project-story h3').count(), 6);
        const heroSource = await page.locator('.hero-image').evaluate(image => image.currentSrc);
        assert.equal(heroSource.includes('workspace-mobile.webp'), viewport.width <= 760);
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
  assert.equal(await page.locator('[data-note]:visible').count(), site.notes.length);
  await page.getByRole('searchbox').fill('第一步');
  assert.equal(await page.locator('[data-note]:visible').count(), 1);
  await page.getByRole('button', { name: 'AI 应用', exact: true }).click();
  assert.equal(await page.locator('#notes-empty').isVisible(), true);
  await page.getByRole('button', { name: '重置筛选' }).click();
  await page.getByRole('link', { name: '从零开始，搭建个人作品集的第一步', exact: true }).click();
  await page.waitForURL('**/notes/building-v0-1/index.html');
  report.interactions.push('Note search, category filter, empty state, reset and article navigation');

  await page.goto(origin + 'notes/index.html?q=PDF%20Agent&category=AI%20应用&sort=oldest');
  assert.equal(await page.locator('[data-note]:visible').count(), 1);
  assert.equal(await page.getByRole('combobox', { name: '笔记排序' }).inputValue(), 'oldest');
  await page.getByRole('button', { name: '清空搜索' }).click();
  assert.equal(await page.getByRole('searchbox').inputValue(), '');
  await page.getByRole('button', { name: '全部笔记', exact: true }).click();
  assert.equal(await page.locator('[data-note]').first().getAttribute('data-date'), '2026-09-08');
  await page.getByRole('combobox', { name: '笔记排序' }).selectOption('newest');
  assert.equal(await page.locator('[data-note]').first().getAttribute('data-date'), '2026-09-09');
  await page.getByRole('searchbox').fill('PDF Agent');
  await page.reload();
  assert.equal(await page.getByRole('searchbox').inputValue(), 'PDF Agent');
  assert.equal(await page.locator('[data-note]:visible').count(), 1);
  await page.locator('[data-note]:visible h3 a').click();
  await page.goBack();
  assert.equal(await page.getByRole('searchbox').inputValue(), 'PDF Agent');
  report.interactions.push('Multi-word search, URL persistence, reload, history, clear search and both date orders');

  await page.goto(origin + 'notes/chatbot-tools/index.html');
  await page.getByRole('navigation', { name: '文章目录' }).getByRole('link', { name: '模型不可用时保留本地能力' }).click();
  await page.waitForURL('**/notes/chatbot-tools/index.html#offline');
  await page.waitForFunction(() => document.querySelector('.article-toc [aria-current]')?.hash === '#offline');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() => document.querySelector('progress').value === 100);
  assert.equal(await page.getByRole('progressbar', { name: '阅读进度' }).count(), 1);
  report.interactions.push('Article table of contents, current section, reading progress and related notes');

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

  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto(origin);
  await page.getByRole('button', { name: '打开导航菜单' }).click();
  assert.equal(await page.locator('#mobile-nav a').first().evaluate(link => document.activeElement === link), true);
  await page.locator('#mobile-nav').getByRole('link', { name: '个人简历' }).click();
  await page.waitForURL('**/resume/index.html');
  report.interactions.push('Short landscape mobile menu scrolls, focuses links and reaches the final navigation item');

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(origin);
  await noJsPage.getByRole('link', { name: '探索我的项目' }).click();
  assert.equal(await noJsPage.locator('.project-card').count(), 2);
  await noJsPage.locator('.fallback-nav').getByRole('link', { name: '技术笔记' }).click();
  assert.equal(await noJsPage.locator('[data-note]').count(), site.notes.length);
  assert.equal(await noJsPage.locator('.notes-tools').isVisible(), false);
  await noJsPage.locator('[data-note] h3 a').first().click();
  assert.equal(await noJsPage.locator('.article-toc').isVisible(), true);
  assert.ok((await noJsPage.locator('[data-reading-body]').innerText()).includes('AST'));
  report.interactions.push('Mobile navigation, notes and article content remain available without JavaScript');
  await noJs.close();

  const enhanced = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const enhancedPage = await enhanced.newPage();
  enhancedPage.on('pageerror', error => report.errors.push(error.message));
  await enhancedPage.goto(origin, { waitUntil: 'networkidle' });
  await enhancedPage.evaluate(() => document.querySelector('.story-columns').scrollIntoView({ behavior: 'instant' }));
  await enhancedPage.waitForFunction(() => document.getAnimations().some(animation => animation.playState === 'running'));
  await enhancedPage.emulateMedia({ reducedMotion: 'reduce' });
  await enhancedPage.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
  assert.equal(await enhancedPage.locator('.story-columns').evaluate(element => getComputedStyle(element).opacity), '1');
  report.interactions.push('Scroll reveal runs with motion enabled and cancels immediately for reduced motion');

  await enhancedPage.route('**/assets/site-preview.webp', route => route.fulfill({ status: 503, contentType: 'text/plain', body: 'Unavailable' }));
  await enhancedPage.goto(origin + 'projects/index.html', { waitUntil: 'networkidle' });
  await enhancedPage.waitForSelector('.image-fallback');
  await enhancedPage.locator('.visual-web').click();
  await enhancedPage.waitForURL('**/projects/personal-site/index.html');
  report.interactions.push('Failed project image displays a fallback while its project link remains usable');
  await enhanced.close();
  if (process.env.CHECK_GITHUB_LINKS === '1') {
    const destinations = new Map();
    const recordNavigation = response => {
      if (response.request().resourceType() === 'document' && response.url().startsWith('https://github.com/')) destinations.set(response.url(), response.status());
    };
    context.on('response', recordNavigation);
    report.repositoryChecks = [];
    const cases = [
      { route: 'index.html', selector: '.github-link', destination: site.github },
      ...site.projects.map(project => ({ route: 'index.html', selector: `.project-source a[href="${project.source}"]`, destination: project.source })),
      ...site.projects.map(project => ({ route: project.path, selector: '.project-links a[target="_blank"]', destination: project.source }))
    ];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const check of cases) {
        await page.goto(origin + check.route);
        const popupOpened = page.waitForEvent('popup');
        await page.locator(check.selector).click();
        const popup = await popupOpened;
        await popup.waitForLoadState('domcontentloaded');
        assert.equal(popup.url(), check.destination);
        assert.equal(destinations.get(check.destination), 200);
        report.repositoryChecks.push({ page: check.route, width, destination: popup.url(), status: 200 });
        await popup.close();
      }
    }
    context.off('response', recordNavigation);
    report.interactions.push('Logged-out GitHub navigation from the header, homepage source links and project detail links on desktop and mobile');
  }
  assert.deepEqual(report.errors, [], 'Browser errors or failed resources');
  await writeFile(path.join(artifacts, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(`Browser validation passed: ${report.pages.length} page/viewport checks; ${report.interactions.length} interaction groups; zero browser errors.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
