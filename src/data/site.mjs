const version = '0.2.0';
export const releaseLabel = `V${version.split('.').slice(0, 2).join('.')}`;

export const site = {
  name: '吴佳诣',
  handle: 'YXY614-ASH',
  version,
  github: 'https://github.com/YXY614-ASH',
  repository: 'https://github.com/YXY614-ASH/personal-site',
  repositoryPublic: false,
  description: '吴佳诣的个人技术作品集。记录 AI 应用、Web 开发与持续学习，展示项目实践和技术思考。',
  resume: null,
  education: {
    level: '本科',
    major: '电气工程及其自动化'
  },
  directions: ['AI 应用', 'Web 开发', '工程实践'],
  projects: [
    {
      id: 'knowledge-agent',
      title: '本地知识库智能问答',
      subtitle: '让知识被找到，让问题有答案。',
      description: '围绕本地知识库，探索检索增强生成与智能体工具调用。以 Gradio 承载问答交互，连接文档、检索与大语言模型。',
      tags: ['Python', 'RAG', 'Agent', 'Gradio'],
      category: 'ai',
      status: '展示筹备中',
      path: 'projects/knowledge-agent/index.html',
      source: null,
      demo: null
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
  notes: [
    {
      slug: 'building-v0-1',
      title: '从零开始，搭建个人作品集的第一步',
      description: '路由、布局、内容与部署：为后续迭代建立一个清晰的起点。',
      category: '工程实践',
      date: '2026-09-08',
      reading: '3 分钟',
      path: 'notes/building-v0-1/index.html'
    }
  ]
};

export const navigation = [
  { id: 'home', label: '首页', path: 'index.html' },
  { id: 'about', label: '关于我', path: 'about/index.html' },
  { id: 'projects', label: '项目作品', path: 'projects/index.html' },
  { id: 'notes', label: '技术笔记', path: 'notes/index.html' },
  { id: 'resume', label: '个人简历', path: 'resume/index.html' }
];
