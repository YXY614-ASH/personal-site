# 部署说明

## 当前交付状态

用户已选择“先本地验收，保留 GitHub Pages 和 Vercel 部署配置”。V0.2 沿用该选择，不进行公网发布。已提供可运行的静态构建与两种托管配置，本地 HTTP、仓库子目录和页面资源已验证。

## GitHub Pages

1. 在仓库 `Settings > Pages` 确认当前账号套餐和仓库可见性支持 Pages。私有仓库的可用性由 GitHub 套餐决定；不要为部署自动将仓库改为公开。
2. 将 `Build and deployment > Source` 设置为 `GitHub Actions`。
3. 在 `Settings > Secrets and variables > Actions > Variables` 新增仓库变量 `PAGES_ENABLED=true`。
4. 在 Actions 中手动运行 `Validate and deploy portfolio`，勾选 `publish`。普通推送仅进行构建和校验，符合本次先本地验收的选择。
5. 确认 build 与 deploy 均成功，再访问工作流给出的 `page_url`。预期地址为 `https://yxy614-ash.github.io/personal-site/`，该预期地址不代表已部署验证。

当 `PAGES_ENABLED` 未启用或未明确勾选 `publish` 时，工作流正常构建、校验和上传构建归档，发布任务跳过，避免本次 Git 归档触发未经选择的公网发布。Vercel 在后续完成账号导入后可接续 main 的持续部署。

构建任务自动设置 `SITE_BASE_PATH=/personal-site/`，用于深层未知地址的 404 资源与导航恢复。其他仓库名由 Actions 自动读取。

工作流权限按任务配置：构建只读仓库，发布任务仅增加 Pages 写入和 OIDC 授权。无硬编码令牌。

## Vercel

1. 在已登录的 Vercel 账号中导入 `YXY614-ASH/personal-site`，确认 GitHub 应用仅获得所需仓库权限。
2. 使用项目已有 `vercel.json`：Framework 为 Other，构建命令 `npm run build`，输出目录 `dist`。
3. 安装步骤仅运行 `node --version`；本站生产构建不安装依赖。
4. Node.js 使用平台支持的 22 或更高版本。根路径部署无需设置 `SITE_BASE_PATH`。
5. 首次部署后检查五个主页面、直接刷新详情页和任意不存在路径的 404 页面。

若平台要求额外授权、付费套餐或修改仓库可见性，应由用户先确认相应设置，不自动购买或扩大访问范围。

## 本地服务

运行 `npm run dev`。服务仅监听 `127.0.0.1`，默认端口 4173，占用时自动递增至最多 4200。

## 版本归档与回溯

- 每次正式迭代提交功能、文档和测试记录，再创建对应版本 Tag。
- 当前标签 `V0.2` 指向本版本归档提交，执行 `git show V0.2` 可查看版本说明；`V0.1` 标签保留原始版本。
- 已有修改时不要直接覆盖工作区，可用 `git worktree add ../personal-site-V0.1 V0.1` 在独立目录查看历史版本。
- CI 的 `site-<提交号>` 构建产物供短期下载；永久回溯依据 Git 提交和 Tag，不依赖 Actions 产物保存期限。
