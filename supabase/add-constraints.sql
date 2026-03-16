-- ============================================================
-- LifeOS — Agregar constraints necesarios para upserts
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Unique constraint para health_metrics (una fila por usuario por día)
CREATE UNIQUE INDEX IF NOT EXISTS health_metrics_user_date_idx
ON health_metrics (user_id, date);

-- Unique constraint para mental_logs (permitir múltiples por día, no necesita unique)
-- mental_logs usa INSERT, no upsert, así que no necesita constraint

-- Verificar
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'health_metrics' AND schemaname = 'public';
