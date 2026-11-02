import { mkdirSync, writeFileSync } from 'node:fs';
import { defaultCourse, weekSummaries } from '../lib/defaults.ts';
import { lessonPlans, lessonContent } from './lesson-plans.mjs';
const q = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const c = defaultCourse;
let sql = '-- Current content reference only. Never apply this over an existing database.\n';
sql += `INSERT INTO courses(id,title,start_date,end_date,duration_weeks,timezone,regular_price,early_price,early_deadline,timetable) VALUES (${q(c.id)},${q(c.title)},${q(c.start_date)},${q(c.end_date)},${c.duration_weeks},${q(c.timezone)},${c.regular_price},${c.early_price},${q(c.early_deadline)},${q(c.timetable)});\n`;
weekSummaries.forEach((week, i) => {
  const weekId = `week-${i + 1}`;
  const moduleId = `daily-module-${i + 1}`;
  sql += `INSERT INTO weeks(id,course_id,title,description,position) VALUES(${q(weekId)},${q(c.id)},${q(week.title)},${q(week.description)},${i + 1});\n`;
  sql += `INSERT INTO modules(id,week_id,title,description,position) VALUES(${q(moduleId)},${q(weekId)},${q(week.title)},${q(week.description)},1);\n`;
  week.lessons.forEach((lesson, j) => {
    const id = `daily-lesson-${i + 1}-${j + 1}`;
    const title = `${lesson.day} · ${lesson.title}`;
    const plan = lessonPlans[i][j];
    sql += `INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES(${q(id)},${q(moduleId)},${q(title)},${q(lesson.description)},${q(plan.outcomes)},${q(lessonContent(i + 1, lesson.day, lesson.title, plan))},${j + 1},1);\n`;
    sql += `INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES(${q(`daily-assignment-${i + 1}-${j + 1}`)},${q(c.id)},${q(id)},${q(title + ' — practice')},${q(plan.practice)},${i * 3 + j + 1});\n`;
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
  sql += `INSERT INTO resources(id,course_id,title,url,kind,position) VALUES('resource-${i + 1}',${q(c.id)},${q(title)},${q(url)},${q(kind)},${i + 1});\n`;
});
mkdirSync(new URL('../.wrangler/', import.meta.url), { recursive: true });
writeFileSync(new URL('../.wrangler/current-curriculum.sql', import.meta.url), sql);
console.log('Generated .wrangler/current-curriculum.sql; production changes use new migrations.');
