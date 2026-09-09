# 吴佳诣的个人技术作品集

V0.2.1 个人资料补充版本。吴佳诣，就读于昆明理工大学津桥学院，电气工程及其自动化专业本科，预计 2027 年毕业，主学嵌入式开发、C 语言和 PLC 自动化技术。围绕个人介绍、项目实践、技术笔记与履历建立持续迭代的技术空间。

## 本地运行

环境要求：Node.js 22 或更高版本。构建与启动没有第三方包依赖，无需执行 `npm install`。

```sh
npm run dev
```

默认地址为 `http://127.0.0.1:4173/`。端口占用时自动尝试后续端口，以终端输出为准。

```sh
npm run check    # 生成站点并运行全量静态、链接和 HTTP 校验
npm run build    # 输出 dist/
npm run preview  # 构建并启动本地预览
```

## 页面

| 页面 | 地址 | 当前状态 |
| --- | --- | --- |
| 首页 | `/` | 姓名、院校、学历与专业、预计毕业时间、主学方向、项目与笔记入口 |
| 关于我 | `/about/` | 介绍、技术方向与教育背景 |
| 项目作品 | `/projects/` | 分类筛选，两个项目展示入口 |
| 技术笔记 | `/notes/` | 搜索、分类、空状态与一篇版本开发笔记 |
| 个人简历 | `/resume/` | 资料预览；真实 PDF 尚未提供 |
| AI 项目 | `/projects/knowledge-agent/` | 展示框架，未接入真实 Demo |
| 网站项目 | `/projects/personal-site/` | 当前项目说明与 V0.1 / V0.2 / V0.2.1 版本记录 |
| 开发笔记 | `/notes/building-v0-1/` | V0.1 历史架构与工程记录 |
| 异常页面 | `/404.html` | 返回首页与导航恢复 |

页面链接使用明确的 `index.html`，兼容静态托管和 GitHub Pages 仓库子目录。

## 工程结构

```text
src/
  components/       共享布局、图标、标签与链接组件
  data/site.mjs     个人资料、项目和笔记数据
  pages/            页面模板
  styles/           响应式全局样式
  app.js            渐进增强交互
public/assets/      已本地化的图片、图标和授权文件
scripts/            构建、本地服务与可选素材再生成脚本
tests/              自动化校验与浏览器回归
docs/               部署说明、版本文档和测试记录
.github/workflows/  持续集成和 Pages 发布流程
dist/               构建产物，不直接提交 Git
```

## 内容维护

修改 `src/data/site.mjs` 可更新姓名、学历、专业、账号、项目和笔记数据；正文模板位于 `src/pages/pages.mjs`。新增页面需要同步添加 `scripts/build.mjs` 路由。发布时同步更新 `package.json` 与内容数据中的版本号，自动校验会检查二者及页面页脚、构建信息的一致性。

院校、学历、专业、预计毕业年份和主学方向已根据用户提供的信息录入，统一维护在 `education` 与 `studyAreas` 中。没有推断入学年份、成绩、技能熟练度或具体硬件经验。正式 PDF 简历和 AI 项目运行资料尚未提供，简历下载按钮保持禁用。

仓库通过 SSH 可访问，但匿名 GitHub API 返回 404。站点因此只提供已验证的 GitHub 个人主页链接，尚未公开的项目源码地址不输出到公开页面。

## 部署与版本

GitHub Pages 与 Vercel 配置已准备，具体开通步骤和权限前提见 [部署说明](docs/DEPLOYMENT.md)。本地运行成功不等同于公网部署成功。

- [V0.2.1 版本文档](docs/versions/V0.2.1.md)
- [V0.2.1 测试报告](docs/versions/V0.2.1-test-report.md)
- [V0.2 历史版本文档](docs/versions/V0.2.md)
- [V0.1 历史版本文档](docs/versions/V0.1.md)
- [更新日志](CHANGELOG.md)
- [素材来源](docs/ASSETS.md)

仓库：`git@github.com:YXY614-ASH/personal-site.git`。当前正式归档标签为 `V0.2.1`，保留 `V0.1`、`V0.2` 标签及远端原始历史。按用户选择仅在本地验收，不进行公网发布。

## 浏览器回归

本次复用了现有 Playwright、Sharp 和 Microsoft Edge，不新增安装。复现时提供已有模块目录及浏览器路径：

```powershell
$env:TOOL_NODE_MODULES = '已有工具的 node_modules 目录'
$env:BROWSER_EXECUTABLE = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run test:browser
```

测试覆盖九个页面、五组视口、交互和真实截图，结果输出到 `artifacts/`。浏览器测试工具不参与站点生产构建。其他机器缺少这些工具时，按开发规则先确认再安装。
