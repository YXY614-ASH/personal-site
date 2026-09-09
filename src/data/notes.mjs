export const notes = [
  {
    slug: 'chatbot-tools',
    title: '从 PDF 检索到计算器：课程助手的工具边界',
    description: '记录 chatbot V0.5 的资料检索、页码引用、计算器与无密钥模式。',
    category: 'AI 应用',
    date: '2026-09-09',
    reading: '4 分钟',
    tags: ['Python', 'RAG', 'Agent'],
    release: 'Chatbot V0.5',
    sections: [
      { id: 'retrieval', title: '从课程 PDF 找到依据', paragraphs: [
        '课程资料问答首先要解决的是定位依据。项目使用 pypdf 提取每一页的文本，分块后检索与问题相关的片段，再把文本和页码作为上下文交给模型。',
        '这里使用的是轻量文本检索，没有接入向量数据库。引用页码能帮助回到原始文档核对，但不能保证模型的每一句回答都正确。扫描版 PDF 缺少可提取文字时，也需要另行处理 OCR。'
      ] },
      { id: 'tools', title: '把检索与计算分开验证', paragraphs: [
        '课程助手按问题选择 PDF 检索和计算器，也可以组合两个工具。规划逻辑根据输入决定工具，不依赖模型自主生成执行代码。',
        '计算器使用 AST 白名单解析数字、括号与基础运算，不调用 eval 执行任意代码。例如 12*(3+4) 的结果由计算工具给出 84，再由模型组织说明。工具成功和模型回答正确是两件需要分别验证的事。'
      ], code: '问题 + PDF\n  -> 工具规划\n  -> PDF 片段与页码 / 计算器结果\n  -> DeepSeek 组织回答' },
      { id: 'offline', title: '模型不可用时保留本地能力', paragraphs: [
        '个人网站的本机启动器从 DEEPSEEK_API_KEY 环境变量接收新密钥。未配置密钥时，仍可运行 PDF 检索与计算器，并明确标注结果来自本地工具。',
        '题目解析卡、学习计划卡和自然语言生成仍需要模型连接。本地工具模式的验收不能代替真实模型生成的验收，Demo 也只监听本机地址。'
      ] },
      { id: 'validation', title: '把边界写进回归测试', paragraphs: [
        '接入测试分别覆盖计算结果、PDF 页码、组合工具规划以及无密钥时的状态提示，并运行原项目测试。这样可以区分文档检索、工具执行和模型生成各自的问题。',
        '后续改进应优先收集真实课程问题，检查检索片段是否相关、引用是否准确，再决定是否需要引入向量检索或更复杂的规划器。'
      ] }
    ]
  },
  {
    slug: 'building-v0-1',
    title: '从零开始，搭建个人作品集的第一步',
    description: '路由、布局、内容与部署：为后续迭代建立一个清晰的起点。',
    category: '工程实践',
    date: '2026-09-08',
    reading: '3 分钟',
    tags: ['JavaScript', 'Node.js', '静态网站'],
    release: 'V0.1 基础架构版本',
    sections: [
      { id: 'scope', title: '先确定第一版要解决的问题', paragraphs: [
        '个人作品集承载的不只是项目列表，也包括个人介绍、技术笔记和履历。V0.1 首先建立这几类内容的入口，让后续更新有明确的位置。',
        '第一版的范围是基础架构。对于尚未提供的教育信息、PDF 简历及 AI 项目演示地址，页面明确保留待补充状态。'
      ] },
      { id: 'structure', title: '选择静态多页面结构', paragraphs: [
        '这个版本使用 HTML、CSS、JavaScript 与 Node.js 原生模块。构建时，共享布局和内容数据被生成为独立的 HTML 页面。导航和正文不依赖客户端 JavaScript，页面可直接访问，也便于搜索引擎读取。'
      ], code: 'src/\n  components/   共享布局与组件\n  data/         个人资料和内容\n  pages/        页面模板\n  styles/       全局样式\nscripts/        构建与本地服务\ntests/          自动化校验\ndocs/           版本与测试记录' },
      { id: 'iteration', title: '给后续迭代留下空间', paragraphs: [
        '项目内容与页面布局分开维护；项目分类和笔记搜索采用渐进增强。即使脚本不可用，项目和文章仍能正常阅读。',
        '部署产物是独立的静态文件，路径兼容 GitHub Pages 的仓库子目录。GitHub Actions 负责构建、校验和发布，Vercel 则通过相同构建命令输出站点。'
      ] },
      { id: 'delivery', title: '把交付过程也当作作品的一部分', paragraphs: [
        '代码之外，同步记录版本范围、环境、测试结果和已知限制。每次正式迭代通过 Git 提交和标签保存，以便回看一次改变为什么发生、完成了什么。',
        '下一步是补齐真实个人资料与项目素材，让这个技术空间逐步拥有更完整的内容。'
      ] }
    ]
  }
].map(note => ({ ...note, path: `notes/${note.slug}/index.html` }));
