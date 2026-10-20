import { writeFileSync } from 'node:fs';
const q = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const weeks = [
  [
    'Think like a builder',
    'Web foundations, AI coding agents, IDE setup, planning and prompting.',
    [
      [
        'How the web fits together',
        'Explain the browser, server, HTML, CSS, JavaScript and HTTP.',
        'Draw the journey from a URL to a rendered page. Identify the frontend, backend and database of three familiar websites. Ask your agent to explain the requests in your browser network panel. Verify its explanation against what you observe.',
        'A diagram of your project’s users, screens and data.',
      ],
      [
        'Your agent, your environment',
        'Set up an IDE and write a useful project brief.',
        'Install your chosen editor and coding agent using official instructions. Create a folder and a version-controlled repository. Write a brief describing your audience, problem, pages, acceptance criteria and constraints. Give your agent one small task at a time; inspect its changes before accepting them. Never put API keys into prompts or committed files.',
        'A project brief with measurable acceptance criteria.',
      ],
    ],
  ],
  [
    'Give your idea a face',
    'Frontend interfaces, design principles and responsive components.',
    [
      [
        'Design a coherent interface',
        'Create an accessible layout, typography scale and component system.',
        'Sketch the mobile layout first. Choose a limited color palette and type scale. Ask your agent to build semantic navigation, buttons and form fields. Check heading order, focus visibility and color contrast yourself. Test empty, loading and error states before adding decorative motion.',
        'A mobile-first homepage with reusable components.',
      ],
      [
        'Responsive by intention',
        'Adapt components to phones, tablets and desktops.',
        'Use flexible grids, relative sizing and content-driven breakpoints. Inspect at 360, 768 and 1440 pixels. Check long text, large text and keyboard navigation. Ask your agent to explain every breakpoint and remove fixed widths that cause horizontal scrolling.',
        'Screenshots and a checklist of responsive fixes.',
      ],
    ],
  ],
  [
    'Make it actually work',
    'Backend concepts, APIs, databases, forms and authentication.',
    [
      [
        'From a form to a database',
        'Validate input server-side and store it safely.',
        'Model your entities and their relationships. Use parameterized queries and database constraints. Trace a form submission through validation, authorization, persistence and response. Intentionally submit invalid and duplicate data; check the errors and stored records.',
        'A working validated form backed by a database.',
      ],
      [
        'Identity and permissions',
        'Distinguish authentication from authorization.',
        'Use an established authentication approach. Keep secrets on the server. Protect every data access by the current user and test with two accounts. Add appropriate session expiry and secure cookies. Ask your agent to identify CSRF and XSS risks, then verify the proposed protections.',
        'A private page with ownership checks.',
      ],
    ],
  ],
  [
    'Take it to the world',
    'Git, GitHub, Cloudflare, domains, DNS, HTTPS and deployment.',
    [
      [
        'Version your work',
        'Use commits, branches and code review to keep changes understandable.',
        'Inspect a diff before committing. Write a commit message that explains the change. Create a branch and pull request. Practice reverting a small change without deleting the repository. Verify that secret files and generated output are ignored.',
        'A repository with readable commits and a reviewed branch.',
      ],
      [
        'Deploy with confidence',
        'Deploy a compatible app and understand domains and HTTPS.',
        'Build locally and test in the target runtime. Configure bindings and secrets in the hosting platform. Deploy a preview first. For a custom domain, follow your registrar and Cloudflare DNS instructions, verify HTTPS and redirects, and keep a rollback plan. Domain purchases and paid usage are separate costs.',
        'A deployed website and an operator checklist.',
      ],
    ],
  ],
  [
    'Build for the real world',
    'SEO, Search Console, performance, accessibility and security.',
    [
      [
        'Help the right people find you',
        'Create useful metadata and public search discovery.',
        'Give each public page a descriptive title, description and canonical URL. Create a sitemap and robots file. Keep private routes out of indexing. Verify domain ownership in Search Console and submit the sitemap. Submission helps discovery but never guarantees indexing.',
        'A public SEO checklist and a private-route indexing audit.',
      ],
      [
        'Quality is a feature',
        'Test performance, accessibility and security.',
        'Inspect loading behavior and reduce unnecessary scripts. Navigate using only a keyboard. Test form validation, user permissions, broken links and failed network requests. Ask your agent for meaningful tests derived from acceptance criteria. Review dependencies and avoid logging private data.',
        'A prioritized quality report with verified fixes.',
      ],
    ],
  ],
  [
    'Launch your own thing',
    'Capstone integration, debugging, testing, deployment and presentations.',
    [
      [
        'Integrate and investigate',
        'Connect your project end to end and debug from evidence.',
        'Revisit the project brief. Test each user journey with realistic data. Reproduce problems, collect evidence, form a hypothesis and change one thing at a time. Review agent-generated diffs. Keep scope achievable and document unresolved issues honestly.',
        'A tested release candidate and a short maintenance guide.',
      ],
      [
        'Ship, showcase, keep learning',
        'Launch your capstone and explain its tradeoffs.',
        'Run your deployment checklist, verify production routes, and demonstrate the problem your site solves. Explain what the AI helped with, what you verified, and what needs future maintenance. Share your deployed URL and repository where appropriate.',
        'A deployed capstone and a five-minute walkthrough.',
      ],
    ],
  ],
];
let sql = '-- Content seed. No fabricated students, payments, revenue or instructor identity.\n';
sql +=
  "INSERT INTO courses(id,title,start_date,end_date,duration_weeks,timezone,regular_price,early_price,early_deadline) VALUES ('ai-web-2026','AI-Powered Web Development Bootcamp','2026-11-09','2026-12-18',6,'Africa/Nairobi',1000000,800000,'2026-11-01T20:59:59.999Z');\n";
weeks.forEach(([title, description, lessons], i) => {
  const week = `week-${i + 1}`,
    module = `module-${i + 1}`;
  sql += `INSERT INTO weeks(id,course_id,title,description,position) VALUES(${q(week)},'ai-web-2026',${q(title)},${q(description)},${i + 1});\n`;
  sql += `INSERT INTO modules(id,week_id,title,description,position) VALUES(${q(module)},${q(week)},${q(title)},${q(description)},1);\n`;
  lessons.forEach(([lt, outcomes, content, assignment], j) => {
    const id = `lesson-${i + 1}-${j + 1}`;
    sql += `INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES(${q(id)},${q(module)},${q(lt)},${q(outcomes)},${q(outcomes)},${q(content)},${j + 1},1);\n`;
    sql += `INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES(${q('assignment-' + (i + 1) + '-' + (j + 1))},'ai-web-2026',${q(id)},${q(lt + ' — practice')},${q(assignment)},${i * 2 + j + 1});\n`;
  });
});
[
  [
    'MDN Web Docs',
    'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    'documentation',
  ],
  ['GitHub skills', 'https://skills.github.com/', 'documentation'],
  ['Cloudflare developer guides', 'https://developers.cloudflare.com/', 'documentation'],
  ['OpenAI Codex documentation', 'https://developers.openai.com/codex/', 'tool'],
].forEach(([title, url, kind], i) => {
  sql += `INSERT INTO resources(id,course_id,title,url,kind,position) VALUES('resource-${i + 1}','ai-web-2026',${q(title)},${q(url)},${q(kind)},${i + 1});\n`;
});
writeFileSync(new URL('../migrations/0002_curriculum.sql', import.meta.url), sql);
