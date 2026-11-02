-- ============================================================
-- LifeOS — Foto de perfil y notificaciones push de verdad
-- Solo agrega tablas nuevas y un bucket; no toca las existentes.
-- El aviso cada 5 minutos (pg_cron) se programa aparte con
-- scripts/programar-push.cjs, porque lleva el secreto y no se sube.
-- ============================================================

-- Tus ajustes: la foto y qué recordatorios quieres, a qué hora y en qué zona horaria
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_path TEXT,                       -- <user_id>/avatar-<fecha>.jpg en el bucket «perfil»
  reminders JSONB NOT NULL DEFAULT '{}',  -- { agua: { on, horas: ['10:00', …] }, … }
  timezone TEXT NOT NULL DEFAULT 'America/Panama',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cada celular o navegador donde activaste las notificaciones
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device TEXT,                            -- «iPhone», «Mac»… para reconocerlo en la lista
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id);

-- Lo ya enviado: el aviso corre cada 5 minutos con margen, y sin esto
-- el mismo recordatorio podría llegar dos veces.
CREATE TABLE IF NOT EXISTS push_sent (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  slot TEXT NOT NULL,                     -- '2026-11-01 22:30' en la hora local
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tag, slot)
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['user_settings', 'push_subscriptions'] LOOP
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
-- push_sent solo la toca el servidor (/api/push, con DATABASE_URL): RLS sin políticas
ALTER TABLE push_sent ENABLE ROW LEVEL SECURITY;

-- Bucket privado para la foto de perfil, una carpeta por persona
INSERT INTO storage.buckets (id, name, public)
VALUES ('perfil', 'perfil', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "perfil_select_own" ON storage.objects;
DROP POLICY IF EXISTS "perfil_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "perfil_delete_own" ON storage.objects;
CREATE POLICY "perfil_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'perfil' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "perfil_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'perfil' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "perfil_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'perfil' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
