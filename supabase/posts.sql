-- ============================================================
-- LifeOS — Módulo Calendario de Publicación (posts)
-- Enfocado a gestión de contenido por CLIENTE (agencia)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ──────────────────────────────────────────────
-- POSTS (publicaciones planificadas por cliente)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'x', 'youtube', 'otro')),
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  publish_time TEXT,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'en_diseno', 'listo', 'publicado')),
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_publish_date_idx ON posts(publish_date);
CREATE INDEX IF NOT EXISTS posts_client_idx ON posts(client);

-- ──────────────────────────────────────────────
-- RLS: cada usuario solo ve/gestiona sus propios posts
-- ──────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts: select own" ON posts;
DROP POLICY IF EXISTS "posts: insert own" ON posts;
DROP POLICY IF EXISTS "posts: update own" ON posts;
DROP POLICY IF EXISTS "posts: delete own" ON posts;
CREATE POLICY "posts: select own" ON posts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "posts: insert own" ON posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts: update own" ON posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "posts: delete own" ON posts FOR DELETE USING (user_id = auth.uid());
