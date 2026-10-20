import type { Course } from './domain';
export const defaultCourse: Course = {
  id: 'ai-web-2026',
  title: 'AI-Powered Web Development Bootcamp',
  start_date: '2026-11-09',
  end_date: '2026-12-18',
  duration_weeks: 6,
  timezone: 'Africa/Nairobi',
  regular_price: 1000000,
  early_price: 800000,
  early_deadline: '2026-11-01T20:59:59.999Z',
  registration_open: 1,
  opens_at: null,
  closes_at: null,
  capacity: null,
  timetable: 'Class days and times will be announced.',
};
export const defaultSite = {
  heroHeadline: 'Complex ideas become practical by doing.',
  heroDescription:
    'Build practical technology skills through guided, project-first learning. From web development to the software and apps ahead, understand complex ideas by making them real.',
  tagline: 'Learn. Build. Create.',
  logoText: 'sanaa',
  accentColor: '#a9ef70',
  logoUrl: '',
  instructorName: 'Learn with a guide.',
  instructorBio:
    'Live guidance, practical feedback, and space to ask questions as you build your own project.',
  instructorImage: '',
  instructorExperience: 'Faculty details will be announced before class.',
  supportEmail: '',
  whatsapp: '',
  socialLinks: [] as { label: string; url: string }[],
  footerText: 'Practical learning for your next chapter.',
  benefits: [
    {
      title: 'Start from zero',
      text: 'No programming background needed. Build the technical understanding to guide AI with confidence.',
    },
    {
      title: 'Make something real',
      text: 'Create an individual website that solves a problem you care about.',
    },
    {
      title: 'Learn with a guide',
      text: 'Live classes, practical feedback, and space to ask the questions that matter.',
    },
    {
      title: 'Go beyond the screen',
      text: 'Work with databases, APIs, GitHub, domains, deployment, and search discovery.',
    },
  ],
  faqs: [
    {
      question: 'Do I need programming experience?',
      answer:
        'No. We start with the foundations. You will learn how websites work, how to guide AI agents, and how to test and maintain what you build.',
    },
    {
      question: 'Do I need a laptop? Can I use only a phone?',
      answer:
        'You need a laptop or desktop, a reliable internet connection, and a modern browser. A phone can help you follow along, but cannot replace the development environment used in this course.',
    },
    {
      question: 'Are classes live?',
      answer:
        'Yes, classes will be held online using Google Meet or Zoom. Final days, times, and joining links will be shared in the student portal once scheduled.',
    },
    {
      question: 'Which AI tools will we use?',
      answer:
        'We teach workflows using coding agents such as OpenAI Codex, GitHub Copilot, and Claude Code. Exact tools and setup instructions will be shared before class.',
    },
    {
      question: 'Will I need paid AI subscriptions?',
      answer:
        'Some tools have usage limits or paid plans. Subscriptions are not included in the program fee unless the academy explicitly announces otherwise. We will explain options and costs before use.',
    },
    {
      question: 'Will I need hosting or a domain?',
      answer:
        'We cover Cloudflare deployment and available hosting options. A custom domain is optional and purchased separately. Third-party usage costs are not included.',
    },
    {
      question: 'Do I receive recordings? What if I miss a session?',
      answer:
        'Recordings are available only when the instructor publishes them with appropriate permission. Recordings and certificates are not currently promised as included benefits. Contact support if you miss a class.',
    },
    {
      question: 'Can parents register their children?',
      answer:
        'Yes. A parent or guardian must sign in using their own verified email, give consent, and provide their contact details. They can pay and manage the learner’s account.',
    },
    {
      question: 'What will I build by the end?',
      answer:
        'You will plan, build, test, and deploy an individual real-world website. Your scope will depend on your interests, available time, and progress.',
    },
    {
      question: 'How do I receive the joining link?',
      answer:
        'After verified payment, sign in to your student portal. Scheduled meeting links are shown privately to enrolled students.',
    },
  ],
};
export type SiteContent = typeof defaultSite;
export const weekSummaries = [
  {
    title: 'Think like a builder',
    description:
      'Web foundations, AI coding agents, your IDE, project planning, and better prompts.',
    tag: 'FOUNDATIONS',
  },
  {
    title: 'Give your idea a face',
    description:
      'Frontend components, visual design, and interfaces that feel right on every screen.',
    tag: 'DESIGN & FRONTEND',
  },
  {
    title: 'Make it actually work',
    description: 'Backends, APIs, databases, forms, and secure authentication.',
    tag: 'BACKEND & DATA',
  },
  {
    title: 'Take it to the world',
    description: 'Git, GitHub, Cloudflare deployments, domains, DNS, and HTTPS.',
    tag: 'SHIP & DEPLOY',
  },
  {
    title: 'Build for the real world',
    description: 'SEO, Search Console, accessibility, performance, and security.',
    tag: 'QUALITY & DISCOVERY',
  },
  {
    title: 'Launch your own thing',
    description: 'Bring it all together. Debug, test, deploy, and present your capstone project.',
    tag: 'THE CAPSTONE',
  },
];
