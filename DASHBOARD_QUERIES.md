# Consultas de Supabase para Dashboards

Este documento detalla las consultas SQL y hooks de React Query necesarios para alimentar los dashboards visuales de LifeOS.

## 1. Dashboard de Finanzas

### Consulta: Resumen Financiero Semanal

```sql
-- Obtener ingresos y gastos de la semana actual
SELECT 
  DATE_TRUNC('day', transaction_date) as date,
  type,
  SUM(amount) as total
FROM transactions
WHERE user_id = $1
  AND transaction_date >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', transaction_date), type
ORDER BY date DESC;
```

### Consulta: Desglose de Gastos por Categoría

```sql
-- Obtener gastos agrupados por categoría (esta semana)
SELECT 
  c.name,
  SUM(ABS(t.amount)) as total
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = $1
  AND t.type = 'expense'
  AND t.transaction_date >= NOW() - INTERVAL '7 days'
GROUP BY c.name
ORDER BY total DESC;
```

### Consulta: Transacciones Recientes

```sql
-- Obtener últimas 20 transacciones del usuario
SELECT 
  t.id,
  t.amount,
  c.name as category,
  t.description,
  t.transaction_date,
  t.type
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = $1
ORDER BY t.transaction_date DESC
LIMIT 20;
```

## 2. Dashboard de Salud

### Consulta: Métricas de Salud de los Últimos 7 Días

```sql
-- Obtener pasos, sueño y ejercicio de los últimos 7 días
SELECT 
  record_date,
  metric_type,
  value
FROM health_metrics
WHERE user_id = $1
  AND record_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY record_date DESC, metric_type;
```

### Consulta: Resumen de Actividades Manuales

```sql
-- Obtener conteo de actividades manuales (hoy)
SELECT 
  entry_type,
  COUNT(*) as count
FROM manual_health_entries
WHERE user_id = $1
  AND record_date = CURRENT_DATE
GROUP BY entry_type;
```

### Consulta: Tendencia de Sueño (Últimos 7 Días)

```sql
-- Obtener tendencia de sueño
SELECT 
  record_date,
  value as sleep_hours
FROM health_metrics
WHERE user_id = $1
  AND metric_type = 'sleep_hours'
  AND record_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY record_date ASC;
```

## 3. Dashboard de Productividad

### Consulta: Horas por Proyecto (Esta Semana)

```sql
-- Obtener tiempo dedicado a cada proyecto
SELECT 
  p.name,
  SUM(pl.duration_minutes) / 60.0 as hours
FROM productivity_logs pl
JOIN projects p ON pl.project_id = p.id
WHERE pl.user_id = $1
  AND pl.log_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.name
ORDER BY hours DESC;
```

### Consulta: Distribución de Tiempo (Hoy)

```sql
-- Obtener distribución de tiempo dedicado hoy
SELECT 
  COALESCE(p.name, pl.activity) as activity,
  SUM(pl.duration_minutes) as minutes
FROM productivity_logs pl
LEFT JOIN projects p ON pl.project_id = p.id
WHERE pl.user_id = $1
  AND pl.log_date = CURRENT_DATE
GROUP BY COALESCE(p.name, pl.activity)
ORDER BY minutes DESC;
```

## 4. Dashboard de Mente y Asunción

### Consulta: Afirmación del Día

```sql
-- Obtener afirmación más reciente del usuario
SELECT 
  text,
  created_at
FROM affirmations
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 1;
```

### Consulta: Tendencia de Estrés (Últimos 7 Días)

```sql
-- Obtener niveles de estrés de los últimos 7 días
SELECT 
  record_date,
  value as stress_level
FROM mind_wellness_entries
WHERE user_id = $1
  AND entry_type = 'stress_level'
  AND record_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY record_date ASC;
```

### Consulta: Resumen de Meditación (Hoy)

```sql
-- Obtener minutos de meditación de hoy
SELECT 
  SUM(value) as meditation_minutes
FROM mind_wellness_entries
WHERE user_id = $1
  AND entry_type = 'meditation_minutes'
  AND record_date = CURRENT_DATE;
```

## 5. Dashboard Principal (Home)

### Consulta: Resumen del Día

```sql
-- Obtener resumen completo del día para los anillos de progreso
SELECT 
  -- Finanzas
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'income' AND transaction_date = CURRENT_DATE) as daily_income,
  (SELECT COALESCE(SUM(ABS(amount)), 0) FROM transactions WHERE user_id = $1 AND type = 'expense' AND transaction_date = CURRENT_DATE) as daily_expenses,
  
  -- Salud
  (SELECT COALESCE(value, 0) FROM health_metrics WHERE user_id = $1 AND metric_type = 'steps' AND record_date = CURRENT_DATE LIMIT 1) as daily_steps,
  (SELECT COALESCE(value, 0) FROM health_metrics WHERE user_id = $1 AND metric_type = 'sleep_hours' AND record_date = CURRENT_DATE LIMIT 1) as daily_sleep,
  
  -- Productividad
  (SELECT COALESCE(SUM(duration_minutes), 0) FROM productivity_logs WHERE user_id = $1 AND log_date = CURRENT_DATE) as daily_productivity_minutes,
  
  -- Mente
  (SELECT COALESCE(value, 0) FROM mind_wellness_entries WHERE user_id = $1 AND entry_type = 'meditation_minutes' AND record_date = CURRENT_DATE LIMIT 1) as daily_meditation;
```

## 6. Implementación en Hooks de React Query

### Ejemplo: useFinancialDashboard

```typescript
export function useFinancialDashboard() {
  return useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: async () => {
      // Resumen semanal
      const { data: weeklySummary } = await supabase.rpc('get_weekly_financial_summary');
      
      // Desglose por categoría
      const { data: expensesByCategory } = await supabase.rpc('get_expenses_by_category');
      
      // Transacciones recientes
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .order('transaction_date', { ascending: false })
        .limit(20);

      return {
        weeklySummary,
        expensesByCategory,
        recentTransactions,
      };
    },
  });
}
```

## 7. Funciones RPC (Remote Procedure Calls) en Supabase

Para optimizar las consultas complejas, puedes crear funciones RPC en Supabase:

```sql
-- Crear función para resumen financiero semanal
CREATE OR REPLACE FUNCTION get_weekly_financial_summary(user_id UUID)
RETURNS TABLE (
  date DATE,
  income NUMERIC,
  expenses NUMERIC
) AS $$
SELECT 
  DATE(transaction_date) as date,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as expenses
FROM transactions
WHERE transactions.user_id = $1
  AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(transaction_date)
ORDER BY date DESC;
$$ LANGUAGE SQL;
```

## Consideraciones de Rendimiento

1. **Índices**: Asegúrate de crear índices en columnas frecuentemente consultadas (user_id, record_date, transaction_date).
2. **Caché**: Utiliza React Query para cachear resultados y reducir llamadas a la base de datos.
3. **Paginación**: Para listas largas, implementa paginación en lugar de cargar todos los datos.
4. **Agregación**: Usa funciones RPC para agregaciones complejas en lugar de procesarlas en el cliente.

## Próximos Pasos

1. Crear funciones RPC en Supabase para las consultas complejas.
2. Implementar hooks de React Query para cada dashboard.
3. Crear componentes visuales para mostrar los datos.
4. Implementar actualización automática de datos.
5. Agregar filtros y opciones de personalización.
