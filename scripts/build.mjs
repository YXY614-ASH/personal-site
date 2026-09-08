import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { layout } from '../src/components/layout.mjs';
import * as pages from '../src/pages/pages.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const routes = [
  { path: 'index.html', title: '首页', active: 'home', render: pages.home },
  { path: 'about/index.html', title: '关于我', active: 'about', render: pages.about },
  { path: 'projects/index.html', title: '项目作品', active: 'projects', render: pages.projects },
  { path: 'notes/index.html', title: '技术笔记', active: 'notes', render: pages.notes },
  { path: 'resume/index.html', title: '个人简历', active: 'resume', render: pages.resume },
  { path: 'projects/knowledge-agent/index.html', title: '本地知识库智能问答', active: 'projects', render: base => pages.projectDetail(base, 'knowledge-agent') },
  { path: 'projects/personal-site/index.html', title: '个人技术作品集', active: 'projects', render: base => pages.projectDetail(base, 'personal-site') },
  { path: 'notes/building-v0-1/index.html', title: '搭建个人作品集的第一步', active: 'notes', render: pages.article },
  { path: '404.html', title: '页面未找到', active: '404', render: pages.notFound }
];

export async function build() {
  const output = path.join(root, 'dist');
  const symbols = await readFile(path.join(root, 'public/assets/icons.svg'), 'utf8');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(root, 'public'), output, { recursive: true });
  await cp(path.join(root, 'src/styles/main.css'), path.join(output, 'assets/styles.css'));
  await cp(path.join(root, 'src/app.js'), path.join(output, 'assets/app.js'));
  for (const route of routes) {
    const base = '../'.repeat(route.path.split('/').length - 1) || './';
    const content = route.render(base);
    const target = path.join(output, route.path);
    await mkdir(path.dirname(target), { recursive: true });
    const head = route.active === '404' ? `<base href="${process.env.SITE_BASE_PATH || '/'}">` : '';
    await writeFile(target, layout({ ...route, base, content, symbols, head }));
  }
  await writeFile(path.join(output, '.nojekyll'), '');
  await writeFile(path.join(output, 'build-info.json'), JSON.stringify({ version: '0.1.0', routes: routes.map(route => route.path) }, null, 2));
  console.log(`Built ${routes.length} pages into dist/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
