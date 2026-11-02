-- Revised cohort: one KES 5,000 fee, 16 November through 18 December 2026.
-- Keep existing transactions, enrollments, lessons, assignments, and progress.
UPDATE courses
SET start_date='2026-11-16', end_date='2026-12-18', duration_weeks=5,
    early_price=500000, regular_price=500000
WHERE id='ai-web-2026';

UPDATE weeks
SET title='Build, polish, and launch',
    description='SEO, Search Console, performance, accessibility, security, and capstone integration, testing, deployment and presentations.'
WHERE id='week-5' AND course_id='ai-web-2026';

-- Move every capstone module before removing its old weekly container.
UPDATE modules
SET position=position+(SELECT COALESCE(MAX(position),0) FROM modules WHERE week_id='week-5'),
    week_id='week-5'
WHERE week_id IN (SELECT id FROM weeks WHERE id='week-6' AND course_id='ai-web-2026')
  AND EXISTS (SELECT 1 FROM weeks WHERE id='week-5' AND course_id='ai-web-2026');

DELETE FROM weeks
WHERE id='week-6' AND course_id='ai-web-2026'
  AND NOT EXISTS (SELECT 1 FROM modules WHERE week_id='week-6');
