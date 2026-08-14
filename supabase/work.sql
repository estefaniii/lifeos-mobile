-- ============================================================
-- LifeOS — Hub de Trabajo: clientes + tareas
-- ============================================================

-- CLIENTES (fichas de cliente de la agencia)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '#14B8A6',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_select_own" ON clients;
DROP POLICY IF EXISTS "clients_insert_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;
DROP POLICY IF EXISTS "clients_delete_own" ON clients;
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "clients_insert_own" ON clients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "clients_update_own" ON clients FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "clients_delete_own" ON clients FOR DELETE USING (user_id = auth.uid());

-- TAREAS (pendientes por cliente, con fecha límite y prioridad)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baja','media','alta')),
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_select_own" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_own" ON tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_own" ON tasks;
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE USING (user_id = auth.uid());
