-- LifeOS — Notas v2: vincular a cliente + archivar
ALTER TABLE notes ADD COLUMN IF NOT EXISTS client TEXT DEFAULT '';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS notes_client_idx ON notes(client);
