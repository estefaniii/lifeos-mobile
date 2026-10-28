-- ============================================================
-- LifeOS — Seguridad: cada persona solo ve y cambia sus filas
-- Estas tablas no tenían RLS: con la clave pública (que viaja en la app)
-- cualquiera podía leerlas por la API REST de Supabase.
-- Se puede correr varias veces sin problema.
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'affirmations', 'budgets', 'chat_messages', 'habit_logs', 'habits', 'health_metrics', 'mental_logs',
    'productivity_logs', 'projects', 'recurring_transactions', 'savings_goals', 'transactions'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_own" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s_select_own" ON %I FOR SELECT USING (user_id = auth.uid()::text)', t, t);
    EXECUTE format('CREATE POLICY "%s_insert_own" ON %I FOR INSERT WITH CHECK (user_id = auth.uid()::text)', t, t);
    EXECUTE format('CREATE POLICY "%s_update_own" ON %I FOR UPDATE USING (user_id = auth.uid()::text)', t, t);
    EXECUTE format('CREATE POLICY "%s_delete_own" ON %I FOR DELETE USING (user_id = auth.uid()::text)', t, t);
  END LOOP;
END $$;

-- La tabla users usa id (no user_id) como dueño. En estas tablas el dueño se guarda como texto.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid()::text);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid()::text);
