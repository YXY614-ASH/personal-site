import { notes } from './notes.mjs';

const version = '0.4.0';
export const releaseLabel = `V${version.replace(/\.0$/, '')}`;

export const site = {
  name: '吴佳诣',
  handle: 'YXY614-ASH',
  version,
  github: 'https://github.com/YXY614-ASH',
  repository: 'https://github.com/YXY614-ASH/personal-site',
  repositoryPublic: false,
  description: '吴佳诣的个人技术作品集。昆明理工大学津桥学院电气工程及其自动化专业本科，预计 2027 年毕业，主学嵌入式开发、C 语言和 PLC 自动化技术。',
  resume: null,
  education: {
    institution: '昆明理工大学津桥学院',
    level: '本科',
    major: '电气工程及其自动化',
    graduation: '预计 2027 年毕业'
  },
  studyAreas: [
    { title: '嵌入式开发', icon: 'blocks', description: '学习嵌入式系统的软件开发，关注程序与硬件之间的联系。' },
    { title: 'C 语言', icon: 'code-2', description: '学习 C 语言编程，在代码实践中积累程序设计基础。' },
    { title: 'PLC 自动化技术', icon: 'git-branch', description: '学习 PLC 控制与自动化技术，关注控制逻辑和系统运行。' }
  ],
  directions: ['AI 应用', 'Web 开发', '工程实践'],
  projects: [
    {
      id: 'knowledge-agent',
      title: '本地知识库智能问答',
      subtitle: '让知识被找到，让问题有答案。',
      description: '围绕本地知识库，探索检索增强生成与智能体工具调用。以 Gradio 承载问答交互，连接文档、检索与大语言模型。',
      tags: ['Python', 'RAG', 'Agent', 'Gradio'],
      category: 'ai',
      status: 'V0.5 Agent · 本地可运行',
      path: 'projects/knowledge-agent/index.html',
      source: 'https://github.com/YXY614-ASH/chatbot',
      demo: 'http://127.0.0.1:7861/',
      release: 'V0.5',
      capabilities: ['PDF 资料问答', '题目解析卡', '学习计划卡', '课程助手 Agent', '安全计算器'],
      architecture: ['Gradio', 'DeepSeek', 'RAG', 'Agent', 'pypdf'],
      integration: { status: 'local', label: '本机 Demo', note: '仅本机访问；未配置 DeepSeek 密钥时提供本地 PDF 检索与计算器结果。' }
    },
    {
      id: 'personal-site',
      title: '个人技术作品集',
      subtitle: '一个持续生长的个人技术空间。',
      description: '用清晰的页面组织项目、笔记与个人履历。从基础架构开始，逐步完善内容、体验与工程流程。',
      tags: ['JavaScript', 'CSS', 'Node.js', 'GitHub Actions'],
      category: 'web',
      status: `${releaseLabel} 已实现`,
      path: 'projects/personal-site/index.html',
      source: null,
      demo: 'index.html'
    }
  ],
  notes
};

export const navigation = [
  { id: 'home', label: '首页', path: 'index.html' },
  { id: 'about', label: '关于我', path: 'about/index.html' },
  { id: 'projects', label: '项目作品', path: 'projects/index.html' },
  { id: 'notes', label: '技术笔记', path: 'notes/index.html' },
  { id: 'resume', label: '个人简历', path: 'resume/index.html' }
];
