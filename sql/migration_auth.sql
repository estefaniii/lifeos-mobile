-- ============================================================
-- LifeOS — Migración a Supabase Auth
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================
-- IMPORTANTE: Este script cambia user_id a UUID de auth.users
-- Los datos anteriores de 'pwa-user-1' se perderán.
-- Si quieres conservarlos, haz un backup antes.

-- ──────────────────────────────────────────────
-- 1. ELIMINAR POLICIES y CONSTRAINTS existentes
-- ──────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Drop existing foreign key constraints
ALTER TABLE transactions      DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE health_metrics    DROP CONSTRAINT IF EXISTS health_metrics_user_id_fkey;
ALTER TABLE mental_logs       DROP CONSTRAINT IF EXISTS mental_logs_user_id_fkey;
ALTER TABLE affirmations      DROP CONSTRAINT IF EXISTS affirmations_user_id_fkey;
ALTER TABLE projects          DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE productivity_logs DROP CONSTRAINT IF EXISTS productivity_logs_user_id_fkey;
ALTER TABLE savings_goals     DROP CONSTRAINT IF EXISTS savings_goals_user_id_fkey;
ALTER TABLE users             DROP CONSTRAINT IF EXISTS users_pkey CASCADE;

-- ──────────────────────────────────────────────
-- 2. LIMPIAR DATOS ANTIGUOS (pwa-user-1)
-- ──────────────────────────────────────────────
DELETE FROM productivity_logs WHERE user_id = 'pwa-user-1';
DELETE FROM mental_logs WHERE user_id = 'pwa-user-1';
DELETE FROM affirmations WHERE user_id = 'pwa-user-1';
DELETE FROM transactions WHERE user_id = 'pwa-user-1';
DELETE FROM health_metrics WHERE user_id = 'pwa-user-1';
DELETE FROM projects WHERE user_id = 'pwa-user-1';
DELETE FROM savings_goals WHERE user_id = 'pwa-user-1';
DELETE FROM chat_messages WHERE user_id = 'pwa-user-1';
DELETE FROM habit_logs WHERE user_id = 'pwa-user-1';
DELETE FROM habits WHERE user_id = 'pwa-user-1';
DELETE FROM budgets WHERE user_id = 'pwa-user-1';
DELETE FROM recurring_transactions WHERE user_id = 'pwa-user-1';
DELETE FROM users WHERE id = 'pwa-user-1';

-- ──────────────────────────────────────────────
-- 3. CAMBIAR COLUMNAS A UUID
-- ──────────────────────────────────────────────
-- Users table: id TEXT -> UUID
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Existing tables: user_id TEXT -> UUID
ALTER TABLE transactions      ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE health_metrics    ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE mental_logs       ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE affirmations      ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE projects          ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE productivity_logs ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE savings_goals     ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE habits            ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE habit_logs        ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE chat_messages     ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE budgets           ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE recurring_transactions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- ──────────────────────────────────────────────
-- 4. AGREGAR COLUMNAS FALTANTES
-- ──────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ──────────────────────────────────────────────
-- 5. DESHABILITAR RLS (para simplificar, tu app es personal)
-- ──────────────────────────────────────────────
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE mental_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE affirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions DISABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- 6. TRIGGER: auto-crear fila en users al registrarse
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ──────────────────────────────────────────────
-- 7. VERIFICAR
-- ──────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('id', 'user_id')
  AND table_name IN ('users','transactions','health_metrics','habits','chat_messages','budgets','recurring_transactions')
ORDER BY table_name, column_name;
