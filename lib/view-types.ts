import type { Course } from './domain';
export interface Week {
  id: string;
  course_id: string;
  title: string;
  description: string;
  position: number;
}
export interface Module {
  id: string;
  week_id: string;
  title: string;
  description: string;
  position: number;
}
export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  outcomes: string;
  content: string;
  position: number;
  published: number;
}
export interface Resource {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  description: string;
  url: string;
  kind: string;
  position: number;
}
export interface Assignment {
  id: string;
  title: string;
  description: string;
  lesson_id: string | null;
  due_at: string | null;
  position: number;
}
export interface Submission {
  id: string;
  assignment_id: string;
  description: string;
  github_url: string | null;
  website_url: string | null;
  status: string;
  feedback: string;
  submitted_at: string;
}
export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}
export interface LiveSession {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  platform: string;
  meeting_url: string | null;
  notes: string;
  status: string;
}
export interface StudentData {
  course: Course;
  weeks: Week[];
  modules: Module[];
  lessons: Lesson[];
  progress: { lesson_id: string; completed_at?: string }[];
  resources: Resource[];
  assignments: Assignment[];
  submissions: Submission[];
  announcements: Announcement[];
  sessions: LiveSession[];
}
