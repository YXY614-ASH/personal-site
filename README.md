# 吴佳诣的个人技术作品集

V0.4.1 公开仓库入口更新版本。吴佳诣，就读于昆明理工大学津桥学院，电气工程及其自动化专业本科，预计 2027 年毕业，主学嵌入式开发、C 语言和 PLC 自动化技术。围绕个人介绍、项目实践、技术笔记与履历建立持续迭代的技术空间。

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
| 首页 | `/` | 个人资料、六项 chatbot 项目拆解、响应式首图、项目与笔记入口 |
| 关于我 | `/about/` | 介绍、技术方向与教育背景 |
| 项目作品 | `/projects/` | 分类筛选，两个项目展示入口 |
| 技术笔记 | `/notes/` | 多词搜索、分类、日期排序、URL 状态保留、两篇工程笔记 |
| 个人简历 | `/resume/` | 资料预览；真实 PDF 尚未提供 |
| AI 项目 | `/projects/knowledge-agent/` | chatbot V0.5 能力、架构和本机 Demo 入口 |
| 网站项目 | `/projects/personal-site/` | 当前项目说明与 V0.1 至 V0.4 版本记录 |
| 开发笔记 | `/notes/building-v0-1/` | V0.1 历史架构与工程记录 |
| AI 笔记 | `/notes/chatbot-tools/` | chatbot 工具边界、页码引用与本地能力记录 |
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

修改 `src/data/site.mjs` 可更新个人资料和项目。笔记集中维护在 `src/data/notes.mjs`：每篇包含唯一 slug、日期、分类、标签和 sections 正文，构建自动生成列表、文章路由、目录和相关阅读，无需手工添加文章路由。正文按纯文本转义，代码块使用 `code` 字段。发布时同步更新 `package.json` 与内容数据中的版本号，自动校验会检查二者及页面页脚、构建信息的一致性。

院校、学历、专业、预计毕业年份和主学方向已根据用户提供的信息录入，统一维护在 `education` 与 `studyAreas` 中。没有推断入学年份、成绩、技能熟练度或具体硬件经验。正式 PDF 简历和 AI 项目运行资料尚未提供，简历下载按钮保持禁用。

2026-09-09 通过未认证 GitHub API 确认 [personal-site](https://github.com/YXY614-ASH/personal-site) 和 [chatbot](https://github.com/YXY614-ASH/chatbot) 均为 public。首页、项目列表和项目详情页提供对应源码入口；顶部 GitHub 链接指向个人主页。本机 Demo 使用 `npm run demo:chatbot` 启动，路径和密钥配置见 [接入说明](docs/versions/V0.3.md)。

## 部署与版本

GitHub Pages 与 Vercel 配置已准备，具体开通步骤和权限前提见 [部署说明](docs/DEPLOYMENT.md)。本地运行成功不等同于公网部署成功。

- [V0.4.1 版本文档](docs/versions/V0.4.1.md)
- [V0.4.1 测试报告](docs/versions/V0.4.1-test-report.md)
- [V0.4 版本文档](docs/versions/V0.4.md)
- [V0.4 测试报告](docs/versions/V0.4-test-report.md)
- [V0.3 版本文档](docs/versions/V0.3.md)
- [V0.3 测试报告](docs/versions/V0.3-test-report.md)
- [V0.2.1 历史版本文档](docs/versions/V0.2.1.md)
- [V0.2 历史版本文档](docs/versions/V0.2.md)
- [V0.1 历史版本文档](docs/versions/V0.1.md)
- [更新日志](CHANGELOG.md)
- [素材来源](docs/ASSETS.md)

仓库：`git@github.com:YXY614-ASH/personal-site.git`。V0.4.1 独立提交并归档为 `V0.4.1` 标签，保留此前标签和历史。按用户选择仅在本地验收，不进行网站公网发布。

## 浏览器回归

本次复用了现有 Playwright、Sharp 和 Microsoft Edge，不新增安装。复现时提供已有模块目录及浏览器路径：

```powershell
$env:TOOL_NODE_MODULES = '已有工具的 node_modules 目录'
$env:BROWSER_EXECUTABLE = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run test:browser
```

测试覆盖十个页面、五组视口、交互、降级场景和真实截图，结果输出到 `artifacts/`。测试默认不修改已跟踪的预览图；需要刷新预览图时显式设置 `UPDATE_PREVIEW=1`。浏览器测试工具不参与站点生产构建。其他机器缺少这些工具时，按开发规则先确认再安装。
