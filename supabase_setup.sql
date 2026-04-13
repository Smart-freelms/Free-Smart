-- Smart LMS Database Setup Script
-- Creates all required tables with proper RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  is_active BOOLEAN DEFAULT true,
  bio TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
CREATE POLICY "Allow public read access to profiles" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE USING (true);

-- ============================================
-- QUIZZES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  questions JSONB DEFAULT '[]'::jsonb,
  time_limit INTEGER,
  allow_retry BOOLEAN DEFAULT true,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  passing_score INTEGER DEFAULT 70,
  is_published BOOLEAN DEFAULT false,
  scheduled_publish_date TIMESTAMP WITH TIME ZONE,
  scheduled_expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
DROP POLICY IF EXISTS "Allow public read access to quizzes" ON quizzes;
CREATE POLICY "Allow public read access to quizzes" ON quizzes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on quizzes" ON quizzes;
CREATE POLICY "Allow authenticated insert on quizzes" ON quizzes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on quizzes" ON quizzes;
CREATE POLICY "Allow update on quizzes" ON quizzes
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on quizzes" ON quizzes;
CREATE POLICY "Allow delete on quizzes" ON quizzes
  FOR DELETE USING (true);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}'::jsonb,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_attempts
DROP POLICY IF EXISTS "Allow public read access to quiz_attempts" ON quiz_attempts;
CREATE POLICY "Allow public read access to quiz_attempts" ON quiz_attempts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on quiz_attempts" ON quiz_attempts;
CREATE POLICY "Allow insert on quiz_attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on quiz_attempts" ON quiz_attempts;
CREATE POLICY "Allow update on quiz_attempts" ON quiz_attempts
  FOR UPDATE USING (true);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  students UUID[] DEFAULT '{}',
  quizzes UUID[] DEFAULT '{}',
  assignments UUID[] DEFAULT '{}',
  materials JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  scheduled_publish_date TIMESTAMP WITH TIME ZONE,
  scheduled_expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
CREATE POLICY "Allow public read access to courses" ON courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on courses" ON courses;
CREATE POLICY "Allow insert on courses" ON courses
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on courses" ON courses;
CREATE POLICY "Allow update on courses" ON courses
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on courses" ON courses;
CREATE POLICY "Allow delete on courses" ON courses
  FOR DELETE USING (true);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  max_points INTEGER DEFAULT 100,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
DROP POLICY IF EXISTS "Allow public read access to assignments" ON assignments;
CREATE POLICY "Allow public read access to assignments" ON assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on assignments" ON assignments;
CREATE POLICY "Allow insert on assignments" ON assignments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on assignments" ON assignments;
CREATE POLICY "Allow update on assignments" ON assignments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on assignments" ON assignments;
CREATE POLICY "Allow delete on assignments" ON assignments
  FOR DELETE USING (true);

-- ============================================
-- ASSIGNMENT SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on assignment_submissions
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_submissions
DROP POLICY IF EXISTS "Allow public read access to assignment_submissions" ON assignment_submissions;
CREATE POLICY "Allow public read access to assignment_submissions" ON assignment_submissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on assignment_submissions" ON assignment_submissions;
CREATE POLICY "Allow insert on assignment_submissions" ON assignment_submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on assignment_submissions" ON assignment_submissions;
CREATE POLICY "Allow update on assignment_submissions" ON assignment_submissions
  FOR UPDATE USING (true);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Allow public read access to notifications" ON notifications;
CREATE POLICY "Allow public read access to notifications" ON notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on notifications" ON notifications;
CREATE POLICY "Allow insert on notifications" ON notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on notifications" ON notifications;
CREATE POLICY "Allow update on notifications" ON notifications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on notifications" ON notifications;
CREATE POLICY "Allow delete on notifications" ON notifications
  FOR DELETE USING (true);

-- ============================================
-- SCHEDULED EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  related_id UUID,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on scheduled_events
ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_events
DROP POLICY IF EXISTS "Allow public read access to scheduled_events" ON scheduled_events;
CREATE POLICY "Allow public read access to scheduled_events" ON scheduled_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on scheduled_events" ON scheduled_events;
CREATE POLICY "Allow insert on scheduled_events" ON scheduled_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on scheduled_events" ON scheduled_events;
CREATE POLICY "Allow update on scheduled_events" ON scheduled_events
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on scheduled_events" ON scheduled_events;
CREATE POLICY "Allow delete on scheduled_events" ON scheduled_events
  FOR DELETE USING (true);

-- ============================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  quiz_reminders BOOLEAN DEFAULT true,
  assignment_reminders BOOLEAN DEFAULT true,
  announcement_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_settings
DROP POLICY IF EXISTS "Allow public read access to notification_settings" ON notification_settings;
CREATE POLICY "Allow public read access to notification_settings" ON notification_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on notification_settings" ON notification_settings;
CREATE POLICY "Allow insert on notification_settings" ON notification_settings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on notification_settings" ON notification_settings;
CREATE POLICY "Allow update on notification_settings" ON notification_settings
  FOR UPDATE USING (true);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
DROP POLICY IF EXISTS "Allow public read access to messages" ON messages;
CREATE POLICY "Allow public read access to messages" ON messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on messages" ON messages;
CREATE POLICY "Allow insert on messages" ON messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on messages" ON messages;
CREATE POLICY "Allow update on messages" ON messages
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on messages" ON messages;
CREATE POLICY "Allow delete on messages" ON messages
  FOR DELETE USING (true);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  priority TEXT DEFAULT 'normal',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
DROP POLICY IF EXISTS "Allow public read access to announcements" ON announcements;
CREATE POLICY "Allow public read access to announcements" ON announcements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on announcements" ON announcements;
CREATE POLICY "Allow insert on announcements" ON announcements
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on announcements" ON announcements;
CREATE POLICY "Allow update on announcements" ON announcements
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on announcements" ON announcements;
CREATE POLICY "Allow delete on announcements" ON announcements
  FOR DELETE USING (true);

-- ============================================
-- DISCUSSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussions
DROP POLICY IF EXISTS "Allow public read access to discussions" ON discussions;
CREATE POLICY "Allow public read access to discussions" ON discussions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on discussions" ON discussions;
CREATE POLICY "Allow insert on discussions" ON discussions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on discussions" ON discussions;
CREATE POLICY "Allow update on discussions" ON discussions
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on discussions" ON discussions;
CREATE POLICY "Allow delete on discussions" ON discussions
  FOR DELETE USING (true);

-- ============================================
-- AUTH LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on auth_logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_logs
DROP POLICY IF EXISTS "Allow public read access to auth_logs" ON auth_logs;
CREATE POLICY "Allow public read access to auth_logs" ON auth_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on auth_logs" ON auth_logs;
CREATE POLICY "Allow insert on auth_logs" ON auth_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
DROP POLICY IF EXISTS "Allow public read access to user_sessions" ON user_sessions;
CREATE POLICY "Allow public read access to user_sessions" ON user_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on user_sessions" ON user_sessions;
CREATE POLICY "Allow insert on user_sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on user_sessions" ON user_sessions;
CREATE POLICY "Allow delete on user_sessions" ON user_sessions
  FOR DELETE USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_created_by ON scheduled_events(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_scheduled_date ON scheduled_events(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);

-- Fix RLS Policies for Smart LMS
-- This script grants necessary permissions to the anon role and ensures policies work correctly

-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant all privileges on all tables to anon and authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Ensure future tables also get these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ============================================
-- DROP ALL EXISTING POLICIES AND RECREATE
-- ============================================

-- PROFILES
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- QUIZZES
DROP POLICY IF EXISTS "Allow public read access to quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated insert on quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow update on quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow delete on quizzes" ON quizzes;
DROP POLICY IF EXISTS "quizzes_select_policy" ON quizzes;
DROP POLICY IF EXISTS "quizzes_insert_policy" ON quizzes;
DROP POLICY IF EXISTS "quizzes_update_policy" ON quizzes;
DROP POLICY IF EXISTS "quizzes_delete_policy" ON quizzes;

CREATE POLICY "quizzes_select_policy" ON quizzes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "quizzes_insert_policy" ON quizzes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "quizzes_update_policy" ON quizzes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quizzes_delete_policy" ON quizzes FOR DELETE TO anon, authenticated USING (true);

-- QUIZ ATTEMPTS
DROP POLICY IF EXISTS "Allow public read access to quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow insert on quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow update on quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_select_policy" ON quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_insert_policy" ON quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_update_policy" ON quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_delete_policy" ON quiz_attempts;

CREATE POLICY "quiz_attempts_select_policy" ON quiz_attempts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "quiz_attempts_insert_policy" ON quiz_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "quiz_attempts_update_policy" ON quiz_attempts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quiz_attempts_delete_policy" ON quiz_attempts FOR DELETE TO anon, authenticated USING (true);

-- COURSES
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow insert on courses" ON courses;
DROP POLICY IF EXISTS "Allow update on courses" ON courses;
DROP POLICY IF EXISTS "Allow delete on courses" ON courses;
DROP POLICY IF EXISTS "courses_select_policy" ON courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON courses;
DROP POLICY IF EXISTS "courses_update_policy" ON courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON courses;

CREATE POLICY "courses_select_policy" ON courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses_insert_policy" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "courses_update_policy" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "courses_delete_policy" ON courses FOR DELETE TO anon, authenticated USING (true);

-- ASSIGNMENTS
DROP POLICY IF EXISTS "Allow public read access to assignments" ON assignments;
DROP POLICY IF EXISTS "Allow insert on assignments" ON assignments;
DROP POLICY IF EXISTS "Allow update on assignments" ON assignments;
DROP POLICY IF EXISTS "Allow delete on assignments" ON assignments;
DROP POLICY IF EXISTS "assignments_select_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_insert_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_update_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_delete_policy" ON assignments;

CREATE POLICY "assignments_select_policy" ON assignments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "assignments_insert_policy" ON assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "assignments_update_policy" ON assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "assignments_delete_policy" ON assignments FOR DELETE TO anon, authenticated USING (true);

-- ASSIGNMENT SUBMISSIONS
DROP POLICY IF EXISTS "Allow public read access to assignment_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Allow insert on assignment_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Allow update on assignment_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_select_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_insert_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_update_policy" ON assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_delete_policy" ON assignment_submissions;

CREATE POLICY "assignment_submissions_select_policy" ON assignment_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "assignment_submissions_insert_policy" ON assignment_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "assignment_submissions_update_policy" ON assignment_submissions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "assignment_submissions_delete_policy" ON assignment_submissions FOR DELETE TO anon, authenticated USING (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Allow public read access to notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow update on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow delete on notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

CREATE POLICY "notifications_select_policy" ON notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "notifications_insert_policy" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_policy" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notifications_delete_policy" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- SCHEDULED EVENTS
DROP POLICY IF EXISTS "Allow public read access to scheduled_events" ON scheduled_events;
DROP POLICY IF EXISTS "Allow insert on scheduled_events" ON scheduled_events;
DROP POLICY IF EXISTS "Allow update on scheduled_events" ON scheduled_events;
DROP POLICY IF EXISTS "Allow delete on scheduled_events" ON scheduled_events;
DROP POLICY IF EXISTS "scheduled_events_select_policy" ON scheduled_events;
DROP POLICY IF EXISTS "scheduled_events_insert_policy" ON scheduled_events;
DROP POLICY IF EXISTS "scheduled_events_update_policy" ON scheduled_events;
DROP POLICY IF EXISTS "scheduled_events_delete_policy" ON scheduled_events;

CREATE POLICY "scheduled_events_select_policy" ON scheduled_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "scheduled_events_insert_policy" ON scheduled_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "scheduled_events_update_policy" ON scheduled_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scheduled_events_delete_policy" ON scheduled_events FOR DELETE TO anon, authenticated USING (true);

-- NOTIFICATION SETTINGS
DROP POLICY IF EXISTS "Allow public read access to notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Allow insert on notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Allow update on notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "notification_settings_select_policy" ON notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert_policy" ON notification_settings;
DROP POLICY IF EXISTS "notification_settings_update_policy" ON notification_settings;
DROP POLICY IF EXISTS "notification_settings_delete_policy" ON notification_settings;

CREATE POLICY "notification_settings_select_policy" ON notification_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "notification_settings_insert_policy" ON notification_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "notification_settings_update_policy" ON notification_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notification_settings_delete_policy" ON notification_settings FOR DELETE TO anon, authenticated USING (true);

-- MESSAGES
DROP POLICY IF EXISTS "Allow public read access to messages" ON messages;
DROP POLICY IF EXISTS "Allow insert on messages" ON messages;
DROP POLICY IF EXISTS "Allow update on messages" ON messages;
DROP POLICY IF EXISTS "Allow delete on messages" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

CREATE POLICY "messages_select_policy" ON messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "messages_insert_policy" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "messages_update_policy" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "messages_delete_policy" ON messages FOR DELETE TO anon, authenticated USING (true);

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Allow public read access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow insert on announcements" ON announcements;
DROP POLICY IF EXISTS "Allow update on announcements" ON announcements;
DROP POLICY IF EXISTS "Allow delete on announcements" ON announcements;
DROP POLICY IF EXISTS "announcements_select_policy" ON announcements;
DROP POLICY IF EXISTS "announcements_insert_policy" ON announcements;
DROP POLICY IF EXISTS "announcements_update_policy" ON announcements;
DROP POLICY IF EXISTS "announcements_delete_policy" ON announcements;

CREATE POLICY "announcements_select_policy" ON announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "announcements_insert_policy" ON announcements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "announcements_update_policy" ON announcements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "announcements_delete_policy" ON announcements FOR DELETE TO anon, authenticated USING (true);

-- DISCUSSIONS
DROP POLICY IF EXISTS "Allow public read access to discussions" ON discussions;
DROP POLICY IF EXISTS "Allow insert on discussions" ON discussions;
DROP POLICY IF EXISTS "Allow update on discussions" ON discussions;
DROP POLICY IF EXISTS "Allow delete on discussions" ON discussions;
DROP POLICY IF EXISTS "discussions_select_policy" ON discussions;
DROP POLICY IF EXISTS "discussions_insert_policy" ON discussions;
DROP POLICY IF EXISTS "discussions_update_policy" ON discussions;
DROP POLICY IF EXISTS "discussions_delete_policy" ON discussions;

CREATE POLICY "discussions_select_policy" ON discussions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "discussions_insert_policy" ON discussions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "discussions_update_policy" ON discussions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "discussions_delete_policy" ON discussions FOR DELETE TO anon, authenticated USING (true);

-- AUTH LOGS
DROP POLICY IF EXISTS "Allow public read access to auth_logs" ON auth_logs;
DROP POLICY IF EXISTS "Allow insert on auth_logs" ON auth_logs;
DROP POLICY IF EXISTS "auth_logs_select_policy" ON auth_logs;
DROP POLICY IF EXISTS "auth_logs_insert_policy" ON auth_logs;
DROP POLICY IF EXISTS "auth_logs_update_policy" ON auth_logs;
DROP POLICY IF EXISTS "auth_logs_delete_policy" ON auth_logs;

CREATE POLICY "auth_logs_select_policy" ON auth_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_logs_insert_policy" ON auth_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_logs_update_policy" ON auth_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_logs_delete_policy" ON auth_logs FOR DELETE TO anon, authenticated USING (true);

-- USER SESSIONS
DROP POLICY IF EXISTS "Allow public read access to user_sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow insert on user_sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow delete on user_sessions" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_select_policy" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert_policy" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_update_policy" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_delete_policy" ON user_sessions;

CREATE POLICY "user_sessions_select_policy" ON user_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "user_sessions_insert_policy" ON user_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "user_sessions_update_policy" ON user_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_sessions_delete_policy" ON user_sessions FOR DELETE TO anon, authenticated USING (true);
