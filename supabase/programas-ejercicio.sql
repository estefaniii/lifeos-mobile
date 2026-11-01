-- ============================================================
-- LifeOS — Programas guiados de ejercicio
--
-- Un programa es un plan de varios días con el video de cada día:
-- el de Chloe Ting, el de Daisy, o uno armado a mano. Los enlaces los
-- guarda Estéfani, NO vienen escritos en el código: un identificador de
-- YouTube escrito a mano se rompe el día que borran el video, y deja el
-- reproductor en blanco dentro de la app sin decir por qué.
--
-- Solo agrega tablas nuevas; no toca las existentes.
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- De quién es: «Chloe Ting», «Daisy Keech», o vacío si es suyo.
  author TEXT,
  -- La página del programa o el canal, para volver a la fuente.
  source_url TEXT,
  -- Los días: [{ dia, titulo, video, descanso, notas }]
  -- En JSON y no en otra tabla porque un programa se edita entero de una
  -- vez y nunca se consulta un día suelto sin su programa.
  days JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS exercise_programs_user_idx ON exercise_programs(user_id, created_at DESC);

-- Qué día de qué programa ya hizo. Una fila por día hecho.
CREATE TABLE IF NOT EXISTS exercise_program_done (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES exercise_programs(id) ON DELETE CASCADE,
  day SMALLINT NOT NULL,
  done_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Un día no se puede marcar dos veces: sin esto, tocar dos veces el
  -- botón contaría el día doble y la racha saldría inflada.
  UNIQUE (user_id, program_id, day)
);
CREATE INDEX IF NOT EXISTS exercise_program_done_idx ON exercise_program_done(user_id, program_id);

-- Cada persona solo ve y cambia lo suyo
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['exercise_programs', 'exercise_program_done'] LOOP
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
