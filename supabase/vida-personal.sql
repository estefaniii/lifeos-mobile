-- ============================================================
-- LifeOS — Ejercicio y Comida (vida personal)
-- Solo agrega tablas nuevas; no toca las existentes.
-- ============================================================

-- Sesiones de ejercicio: cada rutina terminada
CREATE TABLE IF NOT EXISTS exercise_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone TEXT NOT NULL,
  routine TEXT NOT NULL,
  minutes INT NOT NULL DEFAULT 0,
  exercises JSONB NOT NULL DEFAULT '[]',
  done_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS exercise_sessions_user_idx ON exercise_sessions(user_id, done_on DESC);

-- Plan semanal de comidas: un plato por día y momento
CREATE TABLE IF NOT EXISTS meal_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day SMALLINT NOT NULL CHECK (day BETWEEN 0 AND 6),   -- 0 = lunes
  slot TEXT NOT NULL CHECK (slot IN ('desayuno', 'almuerzo', 'merienda', 'cena')),
  meal TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, day, slot)
);

-- Lista de compras
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shopping_items_user_idx ON shopping_items(user_id);

-- Cada persona solo ve y cambia lo suyo
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['exercise_sessions', 'meal_plan', 'shopping_items'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_own" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s_select_own" ON %I FOR SELECT USING (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert_own" ON %I FOR INSERT WITH CHECK (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "%s_update_own" ON %I FOR UPDATE USING (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete_own" ON %I FOR DELETE USING (user_id = auth.uid())', t, t);
  END LOOP;
END $$;
