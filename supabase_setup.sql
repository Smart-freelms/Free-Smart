-- ############################################################################
-- SUPABASE DATABASE SETUP SCRIPT FOR SMART LMS
-- This script sets up tables, RLS policies, functions, and triggers for production.
-- ############################################################################

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
    score NUMERIC(5, 2) NOT NULL,
    total_points INTEGER NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
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
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_quizzes BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_courses BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_assignments BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_submissions BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_announcements BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
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

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ############################################################################
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ############################################################################

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

-- 4.1 PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4.2 QUIZZES POLICIES
CREATE POLICY "Teachers can manage their own quizzes" ON public.quizzes
    FOR ALL USING (auth.uid() = created_by AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher');
CREATE POLICY "Students can view published quizzes" ON public.quizzes
    FOR SELECT USING (is_published = true AND (scheduled_publish_date IS NULL OR scheduled_publish_date <= NOW()) AND (scheduled_expiry_date IS NULL OR scheduled_expiry_date >= NOW()));

-- 4.3 QUIZ ATTEMPTS POLICIES
CREATE POLICY "Students can view and create their own attempts" ON public.quiz_attempts
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view attempts of their quizzes" ON public.quiz_attempts
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_attempts.quiz_id AND created_by = auth.uid()));

-- 4.4 COURSES POLICIES
CREATE POLICY "Teachers can manage their own courses" ON public.courses
    FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Everyone can view published courses" ON public.courses
    FOR SELECT USING (is_published = true);

-- 4.5 ASSIGNMENTS POLICIES
CREATE POLICY "Teachers can manage assignments for their courses" ON public.assignments
    FOR ALL USING (EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND created_by = auth.uid()));
CREATE POLICY "Students can view assignments for their courses" ON public.assignments
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND (auth.uid() = ANY(students) OR is_published = true)));

-- 4.6 SUBMISSIONS POLICIES
CREATE POLICY "Students can manage their own submissions" ON public.submissions
    FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view and grade submissions for their assignments" ON public.submissions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.assignments WHERE id = submissions.assignment_id AND created_by = auth.uid()));

-- 4.7 NOTIFICATIONS POLICIES
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- 4.8 NOTIFICATION SETTINGS POLICIES
CREATE POLICY "Users can manage their own notification settings" ON public.notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- 4.9 MESSAGES POLICIES
CREATE POLICY "Users can manage their own messages" ON public.messages
    FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 4.10 ANNOUNCEMENTS POLICIES
CREATE POLICY "Teachers can manage announcements" ON public.announcements
    FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Students can view published announcements" ON public.announcements
    FOR SELECT USING (is_published = true);

-- 4.11 DISCUSSION POSTS POLICIES
CREATE POLICY "Users can manage their own discussion posts" ON public.discussion_posts
    FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Users can view all discussion posts in their courses" ON public.discussion_posts
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses WHERE id = discussion_posts.course_id AND (auth.uid() = ANY(students) OR auth.uid() = created_by OR is_published = true)));

-- 4.12 SCHEDULED EVENTS POLICIES
CREATE POLICY "Users can manage their own scheduled events" ON public.scheduled_events
    FOR ALL USING (auth.uid() = created_by);

-- 4.13 AUTH LOGS POLICIES
CREATE POLICY "Users can view their own auth logs" ON public.auth_logs
    FOR SELECT USING (auth.uid() = user_id);

-- ############################################################################
-- 5. STORAGE BUCKETS SETUP
-- ############################################################################

-- Note: Storage buckets must be created via the Supabase Dashboard or API,
-- but policies can be defined here if the buckets exist.

-- Storage Policies for 'materials'
-- CREATE POLICY "Materials are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
-- CREATE POLICY "Teachers can upload materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher');

-- Storage Policies for 'submissions'
-- CREATE POLICY "Students can upload their own submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Teachers can view all submissions" ON storage.objects FOR SELECT USING (bucket_id = 'submissions' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher');
-- CREATE POLICY "Students can view their own submissions" ON storage.objects FOR SELECT USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
