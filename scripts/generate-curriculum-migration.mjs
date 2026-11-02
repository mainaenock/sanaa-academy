import { existsSync, writeFileSync } from 'node:fs';
import { publicCurriculum } from '../lib/curriculum.ts';
import { lessonPlans, lessonContent } from './lesson-plans.mjs';

const target = new URL('../migrations/0006_daily_curriculum.sql', import.meta.url);
if (existsSync(target))
  throw new Error('Migration already exists. Add a new migration for later changes.');
const q = (value) => "'" + String(value).replaceAll("'", "''") + "'";
let sql =
  '-- Fifteen Monday/Wednesday/Friday lessons. Preserve prior learning records as unpublished history.\n';
sql +=
  "UPDATE courses SET timetable='Classes on Monday, Wednesday, and Friday. Class times will be announced.' WHERE id='ai-web-2026';\n";
const oldIds = Array.from({ length: 6 }, (_, i) =>
  [1, 2].map((j) => `lesson-${i + 1}-${j}`),
).flat();
sql += `UPDATE lessons SET published=0 WHERE id IN (${oldIds.map(q).join(',')});\n`;
publicCurriculum.forEach((week, i) => {
  const weekId = `week-${i + 1}`;
  const moduleId = `daily-module-${i + 1}`;
  sql += `UPDATE weeks SET title=${q(week.title)},description=${q(week.description)} WHERE id=${q(weekId)} AND course_id='ai-web-2026';\n`;
  sql += `INSERT INTO modules(id,week_id,title,description,position) VALUES(${q(moduleId)},${q(weekId)},${q(week.title)},${q(week.description)},1);\n`;
  week.lessons.forEach((lesson, j) => {
    const plan = lessonPlans[i][j];
    const id = `daily-lesson-${i + 1}-${j + 1}`;
    const title = `${lesson.day} · ${lesson.title}`;
    const content = lessonContent(i + 1, lesson.day, lesson.title, plan);
    sql += `INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES(${q(id)},${q(moduleId)},${q(title)},${q(lesson.description)},${q(plan.outcomes)},${q(content)},${j + 1},1);\n`;
    sql += `INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES(${q(`daily-assignment-${i + 1}-${j + 1}`)},'ai-web-2026',${q(id)},${q(title + ' — practice')},${q(plan.practice)},${i * 3 + j + 1});\n`;
  });
});
// Patch only the changed FAQ answers; retain all other administrator-managed site content.
sql += `UPDATE site_settings SET value=json_set(value,
  '$.faqs', json((SELECT json_group_array(json(
    CASE json_extract(item.value,'$.question')
      WHEN 'Are classes live?' THEN json_set(item.value,'$.answer','Yes. Classes are on Monday, Wednesday, and Friday, online using Google Meet or Zoom. Class times and joining links will be shared in the student portal once scheduled.')
      WHEN 'Will I need hosting or a domain?' THEN json_set(item.value,'$.answer','We guide you through hosting your website on Cloudflare and connecting your chosen domain name. Domain purchases, renewals, and any paid third-party usage are separate from the course fee.')
      ELSE item.value END)) FROM json_each(site_settings.value,'$.faqs') AS item))
), updated_at=CURRENT_TIMESTAMP WHERE key='website' AND json_type(value,'$.faqs')='array';\n`;
writeFileSync(target, sql);
console.log('Created migrations/0006_daily_curriculum.sql. Existing migrations are unchanged.');
