-- ============================================================
-- ADONAI AI - Phase 1 Database Schema
-- ============================================================
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Go to: Project > SQL Editor > New Query > Paste this > Run
-- ============================================================

-- 1. USER PROFILES TABLE
-- Extends Supabase's built-in auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'admin')),
  daily_question_count INTEGER NOT NULL DEFAULT 0,
  last_question_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONVERSATIONS TABLE
-- Each conversation is a thread of messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MESSAGES TABLE
-- Individual messages within a conversation
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ANONYMOUS RATE LIMITING TABLE
-- Tracks daily usage for anonymous (non-authenticated) users by IP
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ip_address, usage_date)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip_date ON public.anonymous_usage(ip_address, usage_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- These ensure users can only access their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- CONVERSATIONS: Users can CRUD their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- MESSAGES: Users can read/create messages in their own conversations
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- ANONYMOUS USAGE: Allow service role full access (backend manages this)
CREATE POLICY "Service role manages anonymous usage"
  ON public.anonymous_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FUNCTION: Auto-create profile on user signup
-- This trigger runs whenever a new user signs up via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: Auto-update the updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- DONE! Your database is ready for ADONAI Phase 1.
-- ============================================================
