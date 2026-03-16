import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * Hook para sincronizar datos de Apple HealthKit con Supabase.
 * Solo activo en iOS. Se ejecuta al montar y cada hora.
 *
 * Sincroniza:
 * - Pasos del día (StepCount)
 * - Minutos de sueño (SleepAnalysis — suma de intervalos)
 * - Calorías activas (ActiveEnergyBurned)
 * - Agua en ml (DietaryWater)
 */
export function useHealthKitSync(userId: string | undefined) {
  const syncHealthData = useCallback(async () => {
    if (Platform.OS !== 'ios' || !userId) return;

    try {
      const AppleHealthKit = require('react-native-health').default;

      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Water,
          ],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (initError: string) => {
        if (initError) {
          console.log('[HealthKit] Error al inicializar:', initError);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const options = { startDate: startOfDay.toISOString() };

        // 1. Pasos
        AppleHealthKit.getStepCount(options, async (_err: any, result: any) => {
          if (!result) return;
          await supabase.from('health_metrics').upsert(
            { user_id: userId, date: today, steps: Math.round(result.value) },
            { onConflict: 'user_id,date' }
          );
        });

        // 2. Calorías activas → exercise_minutes (estimación: 1 min ≈ 8 kcal)
        AppleHealthKit.getActiveEnergyBurned(
          { ...options, endDate: new Date().toISOString() },
          async (_err: any, results: any[]) => {
            if (!results?.length) return;
            const totalKcal = results.reduce((acc, cur) => acc + (cur.value || 0), 0);
            await supabase.from('health_metrics').upsert(
              { user_id: userId, date: today, calories: Math.round(totalKcal), exercise_minutes: Math.round(totalKcal / 8) },
              { onConflict: 'user_id,date' }
            );
          }
        );

        // 3. Sueño — suma de intervalos desde las 8pm de ayer
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(20, 0, 0, 0);
        AppleHealthKit.getSleepSamples(
          { startDate: yesterday.toISOString(), endDate: new Date().toISOString() },
          async (_err: any, results: any[]) => {
            if (!results?.length) return;
            const asleepSamples = results.filter((s: any) => s.value === 'ASLEEP');
            const totalMs = asleepSamples.reduce((acc: number, s: any) => {
              const start = new Date(s.startDate).getTime();
              const end = new Date(s.endDate).getTime();
              return acc + Math.max(0, end - start);
            }, 0);
            const sleepMinutes = Math.round(totalMs / 60000);
            if (sleepMinutes > 0) {
              await supabase.from('health_metrics').upsert(
                { user_id: userId, date: today, sleep_minutes: sleepMinutes },
                { onConflict: 'user_id,date' }
              );
            }
          }
        );

        // 4. Agua (litros → ml)
        AppleHealthKit.getWater(options, async (_err: any, results: any[]) => {
          if (!results?.length) return;
          const totalMl = results.reduce((acc, cur) => acc + (cur.value || 0), 0) * 1000;
          if (totalMl > 0) {
            await supabase.from('health_metrics').upsert(
              { user_id: userId, date: today, water_ml: Math.round(totalMl) },
              { onConflict: 'user_id,date' }
            );
          }
        });

        console.log('[HealthKit] Sync completado');
      });
    } catch (error) {
      console.error('[HealthKit] Error sincronizando:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !userId) return;

    syncHealthData();

    const interval = setInterval(syncHealthData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, syncHealthData]);

  return { syncNow: syncHealthData };
}

/**
 * Solicitar permisos de HealthKit sin iniciar sync (para botón manual)
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  return new Promise((resolve) => {
    try {
      const AppleHealthKit = require('react-native-health').default;
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Water,
          ],
        },
      };
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        resolve(!error);
      });
    } catch {
      resolve(false);
    }
  });
}
