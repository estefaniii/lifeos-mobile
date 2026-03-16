# Integración Completa de Apple HealthKit en LifeOS

## Descripción General

Esta guía proporciona los pasos completos para integrar Apple HealthKit en la app LifeOS usando Expo. HealthKit permite sincronizar automáticamente datos de salud como pasos, sueño y ejercicio desde la app Salud de Apple.

## Requisitos Previos

- Xcode 14+ (para compilar la app en iOS)
- iOS 14.6+ en el dispositivo
- Cuenta de desarrollador de Apple (para permisos de HealthKit)

## Paso 1: Instalar expo-health

```bash
cd /home/ubuntu/lifeos_mobile
pnpm add expo-health
```

## Paso 2: Configurar Permisos en app.config.ts

Actualiza el archivo `app.config.ts` para incluir los permisos de HealthKit:

```typescript
const config: ExpoConfig = {
  // ... configuración existente ...
  
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      NSHealthShareUsageDescription: "LifeOS necesita acceso a tus datos de salud para sincronizar pasos, sueño y ejercicio.",
      NSHealthUpdateUsageDescription: "LifeOS necesita permiso para actualizar tus datos de salud.",
      UIRequiredDeviceCapabilities: ["healthkit"],
    },
  },
  
  plugins: [
    // ... plugins existentes ...
    [
      "expo-health",
      {
        isHealthKitEnabled: true,
      },
    ],
  ],
};
```

## Paso 3: Activar el Hook de Sincronización

En `app/_layout.tsx`, importa y usa el hook de sincronización:

```typescript
import { useHealthKitSync } from '@/hooks/use-healthkit-sync';

export default function RootLayout() {
  // Sincronizar HealthKit automáticamente
  useHealthKitSync();

  return (
    // ... resto del layout ...
  );
}
```

## Paso 4: Descomentar el Código en use-healthkit-sync.ts

El archivo `hooks/use-healthkit-sync.ts` contiene el código comentado para la sincronización real. Descomenta las secciones marcadas con `TODO` para activar la funcionalidad completa.

## Datos Sincronizados

La integración sincroniza automáticamente los siguientes datos:

| Dato | Tipo de HealthKit | Almacenamiento |
|------|------------------|-----------------|
| Pasos | `HKQuantityTypeIdentifierStepCount` | `health_metrics.steps` |
| Sueño | `HKQuantityTypeIdentifierSleepAnalysis` | `health_metrics.sleep_hours` |
| Ejercicio | `HKQuantityTypeIdentifierActiveEnergyBurned` | `health_metrics.exercise_minutes` |

## Frecuencia de Sincronización

- **Al iniciar la app**: Sincronización automática
- **Cada hora**: Sincronización periódica en segundo plano
- **Manual**: Usa `requestHealthKitPermissions()` para solicitar permisos en cualquier momento

## Permisos de Usuario

Cuando el usuario abre la app por primera vez, se le pedirá que otorgue permisos para:

1. **Lectura**: Acceso a datos de pasos, sueño y ejercicio
2. **Escritura**: Capacidad de escribir datos de salud (opcional)

El usuario puede cambiar estos permisos en:
- **Configuración > Privacidad > Salud > LifeOS**

## Pruebas en el Simulador

**Nota**: HealthKit no funciona en el simulador de iOS. Para probar:

1. Usa un dispositivo iOS real
2. O usa Xcode para simular datos de HealthKit en el simulador (más complejo)

## Solución de Problemas

### Error: "HealthKit no disponible"
- Asegúrate de que estés usando un dispositivo iOS real
- Verifica que iOS 14.6+ esté instalado

### Error: "Permisos denegados"
- El usuario debe otorgar permisos en Configuración > Privacidad > Salud
- Intenta eliminar la app y reinstalarla

### Datos no se sincronizan
- Verifica que la app Salud tenga datos registrados
- Comprueba la conexión a internet y a Supabase
- Revisa los logs en la consola de Xcode

## Referencia de API

### useHealthKitSync()

Hook que sincroniza automáticamente datos de HealthKit cada hora.

```typescript
import { useHealthKitSync } from '@/hooks/use-healthkit-sync';

export function MyComponent() {
  useHealthKitSync(); // Sincronización automática
  return <View>...</View>;
}
```

### requestHealthKitPermissions()

Solicita permisos de HealthKit manualmente.

```typescript
import { requestHealthKitPermissions } from '@/hooks/use-healthkit-sync';

const handleRequestPermissions = async () => {
  const granted = await requestHealthKitPermissions();
  if (granted) {
    console.log('Permisos otorgados');
  }
};
```

### getHealthKitData()

Obtiene datos de HealthKit de un período específico.

```typescript
import { getHealthKitData } from '@/hooks/use-healthkit-sync';

const handleGetData = async () => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const data = await getHealthKitData('steps', startDate, new Date());
  console.log('Pasos de los últimos 7 días:', data);
};
```

## Recursos Adicionales

- [Documentación de expo-health](https://docs.expo.dev/versions/latest/sdk/health/)
- [Apple HealthKit Documentation](https://developer.apple.com/healthkit/)
- [Neville Goddard - The Assumption](https://www.nevillegoddard.com/)

## Próximos Pasos

1. Implementar sincronización en segundo plano (Background App Refresh)
2. Agregar notificaciones cuando se alcancen objetivos de salud
3. Crear gráficos más detallados de tendencias de salud
4. Integrar con otros servicios de salud (Fitbit, Garmin, etc.)
