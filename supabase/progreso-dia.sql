-- ============================================================
-- LifeOS — Hora de inicio del día y fotos de progreso
-- ============================================================

-- Con 4, algo hecho a la 1 a. m. cuenta para el día anterior (como en Luni).
-- Va de 0 a 6. Lo leen el historial, los hábitos, el agua y las rachas.
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS day_start_hour SMALLINT NOT NULL DEFAULT 0
  CHECK (day_start_hour BETWEEN 0 AND 6);

-- Fotos de tu cuerpo para ver el progreso: privadas, solo para ti
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,                     -- <user_id>/<archivo> en el bucket «progreso»
  taken_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS progress_photos_user_idx ON progress_photos(user_id, taken_on DESC);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_photos_select_own" ON progress_photos;
DROP POLICY IF EXISTS "progress_photos_insert_own" ON progress_photos;
DROP POLICY IF EXISTS "progress_photos_update_own" ON progress_photos;
DROP POLICY IF EXISTS "progress_photos_delete_own" ON progress_photos;
CREATE POLICY "progress_photos_select_own" ON progress_photos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "progress_photos_insert_own" ON progress_photos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "progress_photos_update_own" ON progress_photos FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "progress_photos_delete_own" ON progress_photos FOR DELETE USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('progreso', 'progreso', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "progreso_select_own" ON storage.objects;
DROP POLICY IF EXISTS "progreso_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "progreso_delete_own" ON storage.objects;
CREATE POLICY "progreso_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'progreso' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "progreso_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progreso' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "progreso_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'progreso' AND (storage.foldername(name))[1] = auth.uid()::text);
