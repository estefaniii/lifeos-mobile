# Integración de Apple HealthKit en LifeOS

## Descripción General

La integración de HealthKit permite a LifeOS extraer automáticamente datos de salud del usuario desde la app Salud de iOS, incluyendo pasos, horas de sueño y minutos de ejercicio. Esta guía detalla cómo implementar esta funcionalidad en la app móvil.

## Dependencias Requeridas

Para trabajar con HealthKit en Expo, necesitamos instalar el paquete `expo-health`:

```bash
pnpm add expo-health
```

## Configuración en app.config.ts

Asegúrate de que `app.config.ts` incluya los permisos necesarios para HealthKit:

```typescript
// En la sección iOS de app.config.ts
ios: {
  infoPlist: {
    NSHealthShareUsageDescription: "LifeOS necesita acceso a tus datos de salud para mostrar tu progreso.",
    NSHealthUpdateUsageDescription: "LifeOS necesita actualizar tus datos de salud.",
    NSHealthClinicalHealthRecordsShareUsageDescription: "LifeOS necesita acceso a tus registros de salud.",
  },
}
```

## Hook: useHealthKitSync

Crea un hook para sincronizar datos de HealthKit:

```typescript
// hooks/use-healthkit-sync.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Health from 'expo-health';
import { supabase } from '@/lib/supabase';

export function useHealthKitSync() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const syncHealthData = async () => {
      try {
        // Solicitar permisos
        const permissions = await Health.requestPermissions([
          Health.HKQuantityTypeIdentifierStepCount,
          Health.HKQuantityTypeIdentifierSleepAnalysis,
          Health.HKQuantityTypeIdentifierActiveEnergyBurned,
        ]);

        if (!permissions) {
          console.log('Permisos de HealthKit denegados');
          return;
        }

        // Obtener datos de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Obtener pasos
        const stepsData = await Health.getStatistics({
          startDate: today,
          endDate: tomorrow,
          period: Health.HKUnit.day(),
          dataType: Health.HKQuantityTypeIdentifierStepCount,
          options: [Health.HKStatisticsOptionCumulativeSum],
        });

        // Obtener sueño
        const sleepData = await Health.getStatistics({
          startDate: today,
          endDate: tomorrow,
          period: Health.HKUnit.day(),
          dataType: Health.HKQuantityTypeIdentifierSleepAnalysis,
          options: [Health.HKStatisticsOptionDiscreteAverage],
        });

        // Obtener ejercicio
        const exerciseData = await Health.getStatistics({
          startDate: today,
          endDate: tomorrow,
          period: Health.HKUnit.day(),
          dataType: Health.HKQuantityTypeIdentifierActiveEnergyBurned,
          options: [Health.HKStatisticsOptionCumulativeSum],
        });

        // Guardar en Supabase
        const todayStr = today.toISOString().split('T')[0];

        // Guardar pasos
        if (stepsData?.sum) {
          await supabase.from('health_metrics').insert([
            {
              metric_type: 'steps',
              value: stepsData.sum,
              record_date: todayStr,
            },
          ]);
        }

        // Guardar sueño (convertir a horas)
        if (sleepData?.average) {
          const sleepHours = sleepData.average / 60; // Convertir minutos a horas
          await supabase.from('health_metrics').insert([
            {
              metric_type: 'sleep_hours',
              value: sleepHours,
              record_date: todayStr,
            },
          ]);
        }

        // Guardar ejercicio (convertir a minutos)
        if (exerciseData?.sum) {
          const exerciseMinutes = exerciseData.sum / 60; // Convertir calorías a minutos (aproximación)
          await supabase.from('health_metrics').insert([
            {
              metric_type: 'exercise_minutes',
              value: exerciseMinutes,
              record_date: todayStr,
            },
          ]);
        }

        console.log('Datos de HealthKit sincronizados correctamente');
      } catch (error) {
        console.error('Error sincronizando HealthKit:', error);
      }
    };

    // Sincronizar al abrir la app
    syncHealthData();

    // Sincronizar cada hora
    const interval = setInterval(syncHealthData, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
```

## Uso en la Pantalla de Salud

```typescript
// app/(tabs)/health.tsx
import { useHealthKitSync } from '@/hooks/use-healthkit-sync';
import { useTodayHealthMetrics } from '@/hooks/use-health';

export default function HealthScreen() {
  // Sincronizar datos de HealthKit
  useHealthKitSync();

  // Obtener métricas de hoy
  const { data: metrics, isLoading } = useTodayHealthMetrics();

  if (isLoading) {
    return <Text>Cargando...</Text>;
  }

  return (
    <ScreenContainer className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-4">
        Salud y Bienestar
      </Text>

      {/* Anillos de progreso */}
      <View className="flex-row justify-around mb-8">
        <ProgressRing
          progress={(metrics?.steps || 0) / 100} // Ajustar según meta
          label="Pasos"
          value={`${metrics?.steps || 0}`}
        />
        <ProgressRing
          progress={(metrics?.sleepHours || 0) / 8 * 100}
          label="Sueño"
          value={`${metrics?.sleepHours || 0}h`}
        />
        <ProgressRing
          progress={(metrics?.exerciseMinutes || 0) / 30 * 100}
          label="Ejercicio"
          value={`${metrics?.exerciseMinutes || 0}m`}
        />
      </View>

      {/* Resto de la pantalla */}
    </ScreenContainer>
  );
}
```

## Consideraciones Importantes

1. **Permisos**: Los permisos de HealthKit deben ser solicitados explícitamente por el usuario.
2. **Privacidad**: Los datos de HealthKit son sensibles; asegúrate de cumplir con las regulaciones de privacidad.
3. **Sincronización**: La sincronización automática debe ser eficiente para no afectar el rendimiento de la app.
4. **Fallback**: Si HealthKit no está disponible (Android, Web), proporciona alternativas manuales.
5. **Caché**: Considera cachear los datos localmente para reducir llamadas a HealthKit.

## Próximos Pasos

1. Implementar el hook `useHealthKitSync` en la pantalla de Salud.
2. Crear la interfaz de usuario para mostrar los datos de HealthKit.
3. Implementar sincronización automática en segundo plano.
4. Agregar opciones para sincronización manual.
5. Implementar fallback para Android y Web.
