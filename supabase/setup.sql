-- ============================================
-- SADR Training OS - Supabase Schema v2
-- Phase 22B: IDs as TEXT for local compatibility
-- ============================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================
-- TRIGGER FUNCTION: Auto-update updated_at
-- ============================================
create or replace function set_updated_at()
returns trigger as $$
begin
    NEW.updated_at = now();
    return NEW;
end;
$$ language plpgsql;

-- ============================================
-- TABLE: athletes (ID as TEXT)
-- ============================================
create table if not exists athletes (
    id text primary key,
    coach_id uuid references auth.users(id) on delete cascade not null,
    pin text,
    name text not null,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create trigger athletes_updated_at
    before update on athletes
    for each row execute function set_updated_at();

alter table athletes enable row level security;

create policy "Coach owns athletes"
    on athletes for all
    using (coach_id = auth.uid());

-- ============================================
-- TABLE: exercises (ID as TEXT)
-- ============================================
create table if not exists exercises (
    id text primary key,
    coach_id uuid references auth.users(id) on delete cascade not null,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create trigger exercises_updated_at
    before update on exercises
    for each row execute function set_updated_at();

alter table exercises enable row level security;

create policy "Coach owns exercises"
    on exercises for all
    using (coach_id = auth.uid());

-- ============================================
-- TABLE: sessions (ID as TEXT, athlete_id as TEXT)
-- ============================================
create table if not exists sessions (
    id text primary key,
    coach_id uuid references auth.users(id) on delete cascade not null,
    athlete_id text references athletes(id) on delete set null,
    status text default 'planned',
    date date,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create trigger sessions_updated_at
    before update on sessions
    for each row execute function set_updated_at();

alter table sessions enable row level security;

create policy "Coach owns sessions"
    on sessions for all
    using (coach_id = auth.uid());

-- ============================================
-- TABLE: templates (ID as TEXT)
-- ============================================
create table if not exists templates (
    id text primary key,
    coach_id uuid references auth.users(id) on delete cascade not null,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create trigger templates_updated_at
    before update on templates
    for each row execute function set_updated_at();

alter table templates enable row level security;

create policy "Coach owns templates"
    on templates for all
    using (coach_id = auth.uid());

-- ============================================
-- INDEXES for common queries
-- ============================================
create index if not exists idx_athletes_coach on athletes(coach_id);
create index if not exists idx_sessions_coach on sessions(coach_id);
create index if not exists idx_sessions_athlete on sessions(athlete_id);
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_sessions_date on sessions(date);
create index if not exists idx_templates_coach on templates(coach_id);
create index if not exists idx_exercises_coach on exercises(coach_id);
