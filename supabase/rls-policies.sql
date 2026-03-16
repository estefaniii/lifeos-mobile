-- ============================================================
-- LifeOS — Schema completo + RLS
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ──────────────────────────────────────────────
-- USERS (perfil público, vinculado a auth.users)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  gender TEXT CHECK (gender IN ('femenino', 'masculino', 'otro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);
-- Agregar columna gender si la tabla ya existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('femenino', 'masculino', 'otro'));

-- ──────────────────────────────────────────────
-- TRANSACTIONS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '',
  source TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);

-- ──────────────────────────────────────────────
-- HEALTH_METRICS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0,
  sleep_minutes INTEGER NOT NULL DEFAULT 0,
  exercise_minutes INTEGER NOT NULL DEFAULT 0,
  water_ml INTEGER NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  meals_tracked BOOLEAN NOT NULL DEFAULT FALSE,
  gym_session BOOLEAN NOT NULL DEFAULT FALSE,
  yoga_session BOOLEAN NOT NULL DEFAULT FALSE,
  massage_session BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS health_metrics_user_id_idx ON health_metrics(user_id);

-- ──────────────────────────────────────────────
-- MENTAL_LOGS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mental_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  meditation_minutes INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mental_logs_user_id_idx ON mental_logs(user_id);

-- ──────────────────────────────────────────────
-- AFFIRMATIONS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affirmations_user_id_idx ON affirmations(user_id);

-- ──────────────────────────────────────────────
-- PROJECTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);

-- ──────────────────────────────────────────────
-- PRODUCTIVITY_LOGS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productivity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS productivity_logs_user_id_idx ON productivity_logs(user_id);

-- ──────────────────────────────────────────────
-- SAVINGS_GOALS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS savings_goals_user_id_idx ON savings_goals(user_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users: select own" ON users;
DROP POLICY IF EXISTS "users: insert own" ON users;
DROP POLICY IF EXISTS "users: update own" ON users;
CREATE POLICY "users: select own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users: insert own" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users: update own" ON users FOR UPDATE USING (id = auth.uid());

-- TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions: select own" ON transactions;
DROP POLICY IF EXISTS "transactions: insert own" ON transactions;
DROP POLICY IF EXISTS "transactions: update own" ON transactions;
DROP POLICY IF EXISTS "transactions: delete own" ON transactions;
CREATE POLICY "transactions: select own" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transactions: insert own" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions: update own" ON transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "transactions: delete own" ON transactions FOR DELETE USING (user_id = auth.uid());

-- HEALTH_METRICS
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "health_metrics: select own" ON health_metrics;
DROP POLICY IF EXISTS "health_metrics: insert own" ON health_metrics;
DROP POLICY IF EXISTS "health_metrics: update own" ON health_metrics;
DROP POLICY IF EXISTS "health_metrics: delete own" ON health_metrics;
CREATE POLICY "health_metrics: select own" ON health_metrics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "health_metrics: insert own" ON health_metrics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "health_metrics: update own" ON health_metrics FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "health_metrics: delete own" ON health_metrics FOR DELETE USING (user_id = auth.uid());

-- MENTAL_LOGS
ALTER TABLE mental_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mental_logs: select own" ON mental_logs;
DROP POLICY IF EXISTS "mental_logs: insert own" ON mental_logs;
DROP POLICY IF EXISTS "mental_logs: update own" ON mental_logs;
DROP POLICY IF EXISTS "mental_logs: delete own" ON mental_logs;
CREATE POLICY "mental_logs: select own" ON mental_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "mental_logs: insert own" ON mental_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "mental_logs: update own" ON mental_logs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "mental_logs: delete own" ON mental_logs FOR DELETE USING (user_id = auth.uid());

-- AFFIRMATIONS
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affirmations: select own" ON affirmations;
DROP POLICY IF EXISTS "affirmations: insert own" ON affirmations;
DROP POLICY IF EXISTS "affirmations: update own" ON affirmations;
DROP POLICY IF EXISTS "affirmations: delete own" ON affirmations;
CREATE POLICY "affirmations: select own" ON affirmations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "affirmations: insert own" ON affirmations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "affirmations: update own" ON affirmations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "affirmations: delete own" ON affirmations FOR DELETE USING (user_id = auth.uid());

-- PROJECTS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects: select own" ON projects;
DROP POLICY IF EXISTS "projects: insert own" ON projects;
DROP POLICY IF EXISTS "projects: update own" ON projects;
DROP POLICY IF EXISTS "projects: delete own" ON projects;
CREATE POLICY "projects: select own" ON projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "projects: insert own" ON projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects: update own" ON projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "projects: delete own" ON projects FOR DELETE USING (user_id = auth.uid());

-- PRODUCTIVITY_LOGS
ALTER TABLE productivity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "productivity_logs: select own" ON productivity_logs;
DROP POLICY IF EXISTS "productivity_logs: insert own" ON productivity_logs;
DROP POLICY IF EXISTS "productivity_logs: update own" ON productivity_logs;
DROP POLICY IF EXISTS "productivity_logs: delete own" ON productivity_logs;
CREATE POLICY "productivity_logs: select own" ON productivity_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "productivity_logs: insert own" ON productivity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "productivity_logs: update own" ON productivity_logs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "productivity_logs: delete own" ON productivity_logs FOR DELETE USING (user_id = auth.uid());

-- SAVINGS_GOALS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "savings_goals: select own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals: insert own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals: update own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals: delete own" ON savings_goals;
CREATE POLICY "savings_goals: select own" ON savings_goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "savings_goals: insert own" ON savings_goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "savings_goals: update own" ON savings_goals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "savings_goals: delete own" ON savings_goals FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- TRIGGER: auto-crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
