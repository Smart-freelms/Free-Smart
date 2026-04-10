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
