-- ============================================================
-- LifeOS — Registros con hora, hobbies y obras en curso
-- Solo agrega tablas nuevas y un bucket; no toca las existentes.
-- ============================================================

-- Registros rápidos: cada toque es una fila con su hora (un vaso de agua,
-- una comida hecha, una meditación). El historial los lee de aquí junto con
-- exercise_sessions, habit_logs y hobby_sessions, sin copiar nada.
CREATE TABLE IF NOT EXISTS life_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('agua', 'comida', 'meditacion', 'animo')),
  amount NUMERIC NOT NULL DEFAULT 1,      -- vasos, minutos…
  label TEXT,                             -- «Almuerzo: lentejas», «tranquila»
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS life_logs_user_idx ON life_logs(user_id, logged_at DESC);

-- Hobbies: lo que haces por gusto, con una meta semanal suave
CREATE TABLE IF NOT EXISTS hobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'otro',      -- tejido, dibujo, pintura, guitarra…
  emoji TEXT NOT NULL DEFAULT '✨',
  color TEXT NOT NULL DEFAULT '#F472B6',
  weekly_goal_min INT NOT NULL DEFAULT 120,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hobbies_user_idx ON hobbies(user_id, active);

-- Obras en curso: proyectos creativos personales
CREATE TABLE IF NOT EXISTS craft_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hobby_id UUID REFERENCES hobbies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'en_proceso'
    CHECK (status IN ('idea', 'en_proceso', 'pausada', 'terminada', 'regalada', 'vendida')),
  progress_pct INT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  started_on DATE,
  finished_on DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS craft_works_user_idx ON craft_works(user_id, status);

-- Sesiones de hobby, opcionalmente sobre una obra
CREATE TABLE IF NOT EXISTS hobby_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hobby_id UUID NOT NULL REFERENCES hobbies(id) ON DELETE CASCADE,
  work_id UUID REFERENCES craft_works(id) ON DELETE SET NULL,
  minutes INT NOT NULL DEFAULT 0,
  note TEXT,
  done_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hobby_sessions_user_idx ON hobby_sessions(user_id, done_at DESC);

-- Fotos de las obras: el archivo vive en el bucket «obras», aquí solo la ruta
CREATE TABLE IF NOT EXISTS craft_work_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES craft_works(id) ON DELETE CASCADE,
  path TEXT NOT NULL,                     -- <user_id>/<work_id>/<archivo>
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS craft_work_images_work_idx ON craft_work_images(work_id, sort_order);

-- Cada persona solo ve y cambia lo suyo
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['life_logs', 'hobbies', 'craft_works', 'hobby_sessions', 'craft_work_images'] LOOP
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

-- Bucket privado para las fotos. La primera carpeta de la ruta es el user_id,
-- y las políticas solo dejan tocar la carpeta propia.
INSERT INTO storage.buckets (id, name, public)
VALUES ('obras', 'obras', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "obras_select_own" ON storage.objects;
DROP POLICY IF EXISTS "obras_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "obras_delete_own" ON storage.objects;
CREATE POLICY "obras_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'obras' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "obras_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'obras' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "obras_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'obras' AND (storage.foldername(name))[1] = auth.uid()::text);
