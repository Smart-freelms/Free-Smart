-- ############################################################################
-- SUPABASE DATABASE SETUP SCRIPT FOR SMART LMS (VERSION 2.10)
-- Comprehensive schema and explicit RLS policies for all entities.
-- ############################################################################

-- Ensure we are in the public schema
SET search_path TO public;

-- ############################################################################
-- 1. TABLES SETUP
-- ############################################################################

-- 1.1 PROFILES (Publicly accessible user information)
-- Linked to auth.users via id
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    is_active BOOLEAN DEFAULT TRUE,
    bio TEXT,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_limit INTEGER, -- In minutes
    allow_retry BOOLEAN DEFAULT TRUE,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options BOOLEAN DEFAULT FALSE,
    passing_score INTEGER DEFAULT 70,
    is_published BOOLEAN DEFAULT FALSE,
    scheduled_publish_date TIMESTAMPTZ,
    scheduled_expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC(10, 2) NOT NULL,
    total_points INTEGER NOT NULL,
    percentage NUMERIC(10, 2) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    time_spent INTEGER NOT NULL, -- In seconds
    passed BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    students UUID[] DEFAULT '{}', -- Array of student profile IDs
    quizzes UUID[] DEFAULT '{}', -- Array of quiz IDs
    assignments UUID[] DEFAULT '{}', -- Array of assignment IDs
    materials JSONB DEFAULT '[]'::jsonb, -- Array of course materials
    is_published BOOLEAN DEFAULT FALSE,
    scheduled_publish_date TIMESTAMPTZ,
    scheduled_expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ NOT NULL,
    max_points INTEGER NOT NULL DEFAULT 100,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    submission_types TEXT[] DEFAULT '{"text"}'::text[],
    scheduled_publish_date TIMESTAMPTZ,
    scheduled_expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    grade INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 NOTIFICATION SETTINGS
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    assignment_reminders BOOLEAN DEFAULT TRUE,
    grade_notifications BOOLEAN DEFAULT TRUE,
    message_notifications BOOLEAN DEFAULT TRUE,
    announcement_notifications BOOLEAN DEFAULT TRUE
);

-- 1.9 MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 DISCUSSION POSTS
CREATE TABLE IF NOT EXISTS public.discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.12 SCHEDULED EVENTS
CREATE TABLE IF NOT EXISTS public.scheduled_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'assignment', 'course', 'announcement')),
    entity_id UUID NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish', 'due', 'reminder')),
    is_completed BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.13 AUTH LOGS
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip TEXT
);

-- ############################################################################
-- 2. INDEXES SETUP
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON public.quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON public.quiz_attempts(quiz_id, user_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON public.courses(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_student ON public.submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON public.announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_course_id ON public.discussion_posts(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_parent_id ON public.discussion_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_date ON public.scheduled_events(scheduled_date);

-- ############################################################################
-- 3. FUNCTIONS & TRIGGERS
-- ############################################################################

-- 3.1 UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.2 ATTACH UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_quizzes ON public.quizzes;
CREATE TRIGGER set_updated_at_quizzes BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_courses ON public.courses;
CREATE TRIGGER set_updated_at_courses BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_assignments ON public.assignments;
CREATE TRIGGER set_updated_at_assignments BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_submissions ON public.submissions;
CREATE TRIGGER set_updated_at_submissions BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_announcements ON public.announcements;
CREATE TRIGGER set_updated_at_announcements BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_discussion_posts ON public.discussion_posts;
CREATE TRIGGER set_updated_at_discussion_posts BEFORE UPDATE ON public.discussion_posts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 3.3 AUTOMATIC PROFILE CREATION ON SIGN UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role;

    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ############################################################################
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ############################################################################

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- DROP ALL EXISTING POLICIES TO ENSURE A CLEAN SLATE
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4.1 PROFILES POLICIES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO anon, authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4.2 QUIZZES POLICIES
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT TO anon, authenticated
    USING (is_published = true OR auth.uid() = created_by);
CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher');
CREATE POLICY "quizzes_update" ON public.quizzes FOR UPDATE TO authenticated
    USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "quizzes_delete" ON public.quizzes FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

-- 4.3 QUIZ ATTEMPTS POLICIES
CREATE POLICY "attempts_select" ON public.quiz_attempts FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_attempts.quiz_id AND q.created_by = auth.uid()));
CREATE POLICY "attempts_insert" ON public.quiz_attempts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_update" ON public.quiz_attempts FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- 4.4 COURSES POLICIES
CREATE POLICY "courses_select" ON public.courses FOR SELECT TO anon, authenticated
    USING (is_published = true OR auth.uid() = created_by OR auth.uid() = ANY(students));
CREATE POLICY "courses_insert" ON public.courses FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "courses_update" ON public.courses FOR UPDATE TO authenticated
    USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "courses_delete" ON public.courses FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

-- 4.5 ASSIGNMENTS POLICIES
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND (c.is_published = true OR auth.uid() = c.created_by OR auth.uid() = ANY(c.students))));
CREATE POLICY "assignments_insert" ON public.assignments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "assignments_update" ON public.assignments FOR UPDATE TO authenticated
    USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "assignments_delete" ON public.assignments FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

-- 4.6 SUBMISSIONS POLICIES
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT TO authenticated
    USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = submissions.assignment_id AND a.created_by = auth.uid()));
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id);
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE TO authenticated
    USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = submissions.assignment_id AND a.created_by = auth.uid()));

-- 4.7 NOTIFICATIONS POLICIES
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 4.8 NOTIFICATION SETTINGS POLICIES
CREATE POLICY "settings_select" ON public.notification_settings FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "settings_insert" ON public.notification_settings FOR INSERT TO anon, authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update" ON public.notification_settings FOR UPDATE TO anon, authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4.9 MESSAGES POLICIES
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- 4.10 ANNOUNCEMENTS POLICIES
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT TO authenticated
    USING (is_published = true OR auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = announcements.course_id AND auth.uid() = ANY(c.students)));
CREATE POLICY "announcements_insert" ON public.announcements FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "announcements_update" ON public.announcements FOR UPDATE TO authenticated
    USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "announcements_delete" ON public.announcements FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

-- 4.11 DISCUSSION POSTS POLICIES
CREATE POLICY "posts_select" ON public.discussion_posts FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = discussion_posts.course_id AND (c.is_published = true OR auth.uid() = c.created_by OR auth.uid() = ANY(c.students))));
CREATE POLICY "posts_insert" ON public.discussion_posts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON public.discussion_posts FOR UPDATE TO authenticated
    USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON public.discussion_posts FOR DELETE TO authenticated
    USING (auth.uid() = author_id);

-- 4.12 SCHEDULED EVENTS POLICIES
CREATE POLICY "events_select" ON public.scheduled_events FOR SELECT TO authenticated
    USING (auth.uid() = created_by);
CREATE POLICY "events_insert" ON public.scheduled_events FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update" ON public.scheduled_events FOR UPDATE TO authenticated
    USING (auth.uid() = created_by);
CREATE POLICY "events_delete" ON public.scheduled_events FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

-- 4.13 AUTH LOGS POLICIES
CREATE POLICY "logs_select" ON public.auth_logs FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "logs_insert" ON public.auth_logs FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ############################################################################
-- 5. PERMISSIONS
-- ############################################################################

-- 5.1 USAGE GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 5.2 ALL PERMISSIONS TO AUTHENTICATED
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 5.3 ALL PERMISSIONS TO ANON (RLS PROVIDES SECURITY)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
