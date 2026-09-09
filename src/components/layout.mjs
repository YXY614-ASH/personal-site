import { site, navigation, releaseLabel } from '../data/site.mjs';

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export const icon = (name, className = '') => `<svg class="icon ${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
export const tags = values => `<div class="tags">${values.map(value => `<span>${escapeHtml(value)}</span>`).join('')}</div>`;
export const link = (href, label, className = 'text-link', external = false) => `<a class="${className}" href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}${icon(external ? 'arrow-up-right' : 'arrow-right')}</a>`;

export function educationDetails() {
  return `<dl class="education-facts"><div><dt>院校</dt><dd>${escapeHtml(site.education.institution)}</dd></div><div><dt>学历</dt><dd>${escapeHtml(site.education.level)}</dd></div><div><dt>专业</dt><dd>${escapeHtml(site.education.major)}</dd></div><div><dt>毕业</dt><dd>${escapeHtml(site.education.graduation)}</dd></div></dl>`;
}

export function capabilities(values) {
  return `<ul class="capability-list">${values.map(value => `<li>${icon('check')}${escapeHtml(value)}</li>`).join('')}</ul>`;
}

export function pageHeading(eyebrow, title, description) {
  return `<header class="page-heading"><span class="eyebrow">${eyebrow}</span><h1>${title}<span class="green-dot">.</span></h1><p>${description}</p></header>`;
}

export function layout({ title, active, base, content, symbols, head = '', description = site.description }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  ${head}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="author" content="${escapeHtml(site.name)}">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f8f9f7">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(site.name)}个人作品集">
  <meta property="og:title" content="${escapeHtml(title)} | ${site.name}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${base}assets/workspace.webp">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="./index.html">
  <link rel="manifest" href="${base}site.webmanifest">
  <title>${escapeHtml(title)} | ${site.name}个人作品集</title>
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${base}assets/styles.css">
  <script src="${base}assets/app.js" defer></script>
</head>
<body data-page="${active}">
  <a class="skip-link" href="#main">跳转到主要内容</a>
  <svg class="icon-symbols" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${symbols}</svg>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="${base}index.html" aria-label="${site.name} 首页">wjy<span>_</span><span class="brand-caption">PERSONAL SPACE</span></a>
      <nav class="desktop-nav" aria-label="主导航">${navigation.map(item => `<a href="${base}${item.path}"${active === item.id ? ' aria-current="page"' : ''}>${item.label}</a>`).join('')}</nav>
      <a class="github-link" href="${site.github}" target="_blank" rel="noopener noreferrer">${icon('github')}<span>GitHub</span>${icon('arrow-up-right')}</a>
      <button class="icon-button menu-toggle" data-enhanced aria-label="打开导航菜单" title="导航菜单" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}${icon('x')}</button>
    </div>
    <nav id="mobile-nav" class="mobile-nav" aria-label="移动端导航" hidden>${navigation.map(item => `<a href="${base}${item.path}"${active === item.id ? ' aria-current="page"' : ''}>${item.label}${icon('arrow-up-right')}</a>`).join('')}</nav>
  </header>
  <noscript><nav class="fallback-nav container" aria-label="备用导航">${navigation.map(item => `<a href="${base}${item.path}">${item.label}</a>`).join('')}</nav></noscript>
  <main id="main">${content}</main>
  <footer class="site-footer"><div class="container footer-top"><a class="brand" href="${base}index.html">wjy<span>_</span></a><p>保持好奇，持续构建。</p>${link(site.github, '在 GitHub 找到我', 'text-link', true)}</div><div class="container footer-bottom"><span>© 2026 ${site.name}. Built with intention.</span><span>个人作品集 <span class="footer-version">${releaseLabel}</span></span><a href="${base}projects/personal-site/index.html#version-history">更新记录 ${icon('arrow-up-right')}</a></div></footer>
  <button class="back-top icon-button" aria-label="返回顶部" title="返回顶部" hidden>${icon('arrow-up')}</button>
</body>
</html>`;
}
