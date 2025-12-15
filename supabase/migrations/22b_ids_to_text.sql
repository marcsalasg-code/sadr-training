-- ============================================
-- SADR Training OS - Migration: UUIDs to TEXT
-- Phase 22B: Convert existing UUID columns to TEXT
-- ============================================
-- 
-- USE THIS MIGRATION IF:
-- - You already have tables with UUID primary keys
-- - You have data you want to preserve
--
-- OPTION A: Fresh Database (recommended for MVP)
-- If your database is empty or you can reset:
-- 1. Drop all tables and run setup.sql fresh
--
-- OPTION B: Migrate existing data (below)
-- If you have data to preserve, run this migration

-- ============================================
-- STEP 1: Create new tables with TEXT ids
-- ============================================

-- Drop old policies first (they reference columns we're changing)
drop policy if exists "Coach owns athletes" on athletes;
drop policy if exists "Coach owns sessions" on sessions;
drop policy if exists "Coach owns templates" on templates;
drop policy if exists "Coach owns exercises" on exercises;

-- Drop old triggers
drop trigger if exists athletes_updated_at on athletes;
drop trigger if exists sessions_updated_at on sessions;
drop trigger if exists templates_updated_at on templates;
drop trigger if exists exercises_updated_at on exercises;

-- ============================================
-- Athletes: UUID -> TEXT
-- ============================================
alter table athletes 
    alter column id type text using id::text;

-- ============================================
-- Sessions: UUID -> TEXT, athlete_id UUID -> TEXT
-- ============================================
-- First drop the FK constraint
alter table sessions 
    drop constraint if exists sessions_athlete_id_fkey;

alter table sessions 
    alter column id type text using id::text,
    alter column athlete_id type text using athlete_id::text;

-- Re-add FK as text reference
alter table sessions
    add constraint sessions_athlete_id_fkey 
    foreign key (athlete_id) references athletes(id) on delete set null;

-- ============================================
-- Templates: UUID -> TEXT
-- ============================================
alter table templates 
    alter column id type text using id::text;

-- ============================================
-- STEP 2: Recreate triggers
-- ============================================
create trigger athletes_updated_at
    before update on athletes
    for each row execute function set_updated_at();

create trigger sessions_updated_at
    before update on sessions
    for each row execute function set_updated_at();

create trigger templates_updated_at
    before update on templates
    for each row execute function set_updated_at();

create trigger exercises_updated_at
    before update on exercises
    for each row execute function set_updated_at();

-- ============================================
-- STEP 3: Recreate RLS policies
-- ============================================
create policy "Coach owns athletes"
    on athletes for all
    using (coach_id = auth.uid());

create policy "Coach owns sessions"
    on sessions for all
    using (coach_id = auth.uid());

create policy "Coach owns templates"
    on templates for all
    using (coach_id = auth.uid());

create policy "Coach owns exercises"
    on exercises for all
    using (coach_id = auth.uid());

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify migration:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'id';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sessions' AND column_name IN ('id', 'athlete_id');
