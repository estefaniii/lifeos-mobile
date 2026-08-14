-- ============================================================
-- LifeOS — Módulo de Notas
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  color TEXT DEFAULT '#18181B',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_pinned_idx ON notes(pinned);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_select_own" ON notes;
DROP POLICY IF EXISTS "notes_insert_own" ON notes;
DROP POLICY IF EXISTS "notes_update_own" ON notes;
DROP POLICY IF EXISTS "notes_delete_own" ON notes;
CREATE POLICY "notes_select_own" ON notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notes_insert_own" ON notes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes_update_own" ON notes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notes_delete_own" ON notes FOR DELETE USING (user_id = auth.uid());
