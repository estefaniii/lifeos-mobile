-- ============================================================
-- LifeOS — FIX CRÍTICO: Desacoplar de Supabase Auth
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. ELIMINAR TODAS LAS POLICIES (sin importar el nombre)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users','transactions','health_metrics','mental_logs',
                        'affirmations','projects','productivity_logs','savings_goals')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. ELIMINAR FOREIGN KEYS que requieren auth.users
ALTER TABLE transactions      DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE health_metrics    DROP CONSTRAINT IF EXISTS health_metrics_user_id_fkey;
ALTER TABLE mental_logs       DROP CONSTRAINT IF EXISTS mental_logs_user_id_fkey;
ALTER TABLE affirmations      DROP CONSTRAINT IF EXISTS affirmations_user_id_fkey;
ALTER TABLE projects          DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE productivity_logs DROP CONSTRAINT IF EXISTS productivity_logs_user_id_fkey;
ALTER TABLE savings_goals     DROP CONSTRAINT IF EXISTS savings_goals_user_id_fkey;
ALTER TABLE users             DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. CAMBIAR user_id A TEXT (acepta cualquier formato de ID)
ALTER TABLE transactions      ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE health_metrics    ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE mental_logs       ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE affirmations      ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE projects          ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE productivity_logs ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE savings_goals     ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE users             ALTER COLUMN id      TYPE TEXT USING id::TEXT;

-- 4. AGREGAR COLUMNA GENDER si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('femenino', 'masculino', 'otro'));

-- 5. DESHABILITAR RLS
ALTER TABLE users             DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions      DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics    DISABLE ROW LEVEL SECURITY;
ALTER TABLE mental_logs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE affirmations      DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects          DISABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals     DISABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR resultado
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('id', 'user_id')
  AND table_name IN ('users','transactions','health_metrics','mental_logs','affirmations','projects','productivity_logs','savings_goals')
ORDER BY table_name, column_name;
