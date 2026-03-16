# Diseño de Interfaz Móvil - LifeOS

## Visión General

LifeOS es una aplicación de gestión de vida personal que se siente como una extensión natural del ecosistema iOS. El diseño sigue las **Apple Human Interface Guidelines** (HIG) con énfasis en claridad, jerarquía visual y accesibilidad de una mano. La app utiliza un sistema de pestañas (tab bar) para navegación principal y un diseño limpio basado en tarjetas y gráficos.

## Pantallas Principales

### 1. **Home (Dashboard Principal)**
- **Contenido Principal:**
  - Tarjeta de bienvenida con afirmación personalizada del día
  - Anillos de progreso diario (3 anillos: Finanzas, Salud, Productividad)
  - Resumen rápido de hoy: ingresos/gastos netos, pasos, minutos de meditación
  - Botón flotante para registro rápido vía Telegram
- **Funcionalidad:**
  - Pull-to-refresh para actualizar datos
  - Toque en anillo para ver detalles de esa categoría
  - Acceso a notificaciones recientes

### 2. **Finanzas**
- **Contenido Principal:**
  - Gráfico de barras: Ingresos vs. Gastos (últimos 7 días)
  - Gráfico de pastel: Desglose de gastos por categoría (esta semana)
  - Tarjeta de balance: Ingresos totales, gastos totales, balance neto
  - Lista de transacciones recientes (últimas 10)
- **Funcionalidad:**
  - Filtro por período (día, semana, mes, año)
  - Toque en categoría para ver detalles
  - Botón para agregar transacción manual
  - Búsqueda de transacciones

### 3. **Salud y Bienestar**
- **Contenido Principal:**
  - Anillos de progreso diario (Sueño, Pasos, Ejercicio)
  - Gráfico de línea: Tendencia de sueño (últimos 7 días)
  - Gráfico de barras: Pasos diarios (últimos 7 días)
  - Tarjeta de actividades manuales (Gimnasio, Yoga, Masajes, Alimentación)
  - Nivel de estrés y minutos de meditación (hoy)
- **Funcionalidad:**
  - Sincronización automática con HealthKit (iOS)
  - Entrada manual de actividades
  - Historial de actividades
  - Notificaciones de recordatorios (yoga, gimnasio, etc.)

### 4. **Productividad**
- **Contenido Principal:**
  - Tarjetas de proyectos (Tesis, Negocio Personal, Aprender Francés, etc.)
  - Gráfico de barras: Horas dedicadas por proyecto (esta semana)
  - Gráfico de pastel: Distribución de tiempo (hoy)
  - Lista de actividades recientes
- **Funcionalidad:**
  - Crear/editar proyectos
  - Registrar tiempo dedicado a cada proyecto
  - Ver historial de productividad
  - Recordatorios de sesiones de trabajo

### 5. **Mente y Asunción**
- **Contenido Principal:**
  - Afirmación del día (grande y destacada)
  - Historial de afirmaciones (últimas 7)
  - Nivel de estrés (escala 1-10)
  - Minutos de meditación (hoy)
  - Gráfico de línea: Tendencia de estrés (últimos 7 días)
- **Funcionalidad:**
  - Generar nueva afirmación (toque en botón)
  - Registrar sesión de meditación
  - Registrar nivel de estrés
  - Historial de meditaciones

### 6. **Perfil y Configuración**
- **Contenido Principal:**
  - Información del usuario (nombre, foto, Telegram ID)
  - Preferencias de notificaciones
  - Configuración de la IA (persona, tono)
  - Conexión con Telegram
  - Configuración de sincronización con HealthKit
  - Opción de exportar datos
- **Funcionalidad:**
  - Editar perfil
  - Cambiar tema (claro/oscuro)
  - Gestionar permisos
  - Desconectar cuenta

## Flujos de Usuario Clave

### Flujo 1: Registrar Transacción Financiera
1. Usuario toca botón "+" en pestaña Finanzas
2. Se abre modal con campos: Monto, Categoría (dropdown), Descripción, Tipo (Ingreso/Gasto)
3. Usuario completa y toca "Guardar"
4. Transacción se sincroniza con Supabase
5. Gráficos se actualizan automáticamente

### Flujo 2: Ver Resumen Diario
1. Usuario abre app (Home)
2. Ve anillos de progreso y afirmación del día
3. Toca anillo de Finanzas para ver detalles
4. Se navega a pestaña Finanzas con datos del día
5. Usuario puede ver gráficos y transacciones

### Flujo 3: Sincronizar Datos de HealthKit
1. Usuario abre pestaña Salud
2. App solicita permisos a HealthKit (primera vez)
3. Usuario autoriza
4. App extrae: pasos, sueño, ejercicio
5. Datos se muestran en anillos de progreso
6. Se sincronizan con Supabase

### Flujo 4: Recibir Notificación Proactiva
1. Bot de Telegram envía recordatorio programado (ej. "Hora de yoga")
2. Usuario toca notificación
3. Se abre app en pestaña Salud
4. Usuario registra actividad
5. Anillo de progreso se actualiza

## Paleta de Colores

| Elemento | Color Claro | Color Oscuro | Uso |
|----------|------------|-------------|-----|
| Primary | #0a7ea4 | #0a7ea4 | Botones, acentos, anillos activos |
| Background | #ffffff | #151718 | Fondo de pantalla |
| Surface | #f5f5f5 | #1e2022 | Tarjetas, modales |
| Foreground | #11181C | #ECEDEE | Texto principal |
| Muted | #687076 | #9BA1A6 | Texto secundario |
| Border | #E5E7EB | #334155 | Divisores, bordes |
| Success | #22C55E | #4ADE80 | Ingresos, éxito |
| Warning | #F59E0B | #FBBF24 | Advertencias, cambios |
| Error | #EF4444 | #F87171 | Gastos, errores |

## Componentes Reutilizables

1. **ProgressRing**: Anillo de progreso circular (0-100%)
2. **BarChart**: Gráfico de barras con eje X y Y
3. **PieChart**: Gráfico de pastel con leyenda
4. **LineChart**: Gráfico de línea con tendencia
5. **TransactionCard**: Tarjeta de transacción (monto, categoría, descripción)
6. **ProjectCard**: Tarjeta de proyecto (nombre, estado, horas)
7. **AffirmationCard**: Tarjeta de afirmación (texto grande, botón de compartir)
8. **ScreenContainer**: Contenedor de pantalla con SafeArea

## Consideraciones de Diseño

- **Accesibilidad de una mano**: Elementos interactivos en la mitad inferior de la pantalla
- **Contraste**: Relación de contraste mínima 4.5:1 para texto
- **Tipografía**: Sistema de tipografía jerárquico (Display, Headline, Body, Caption)
- **Espaciado**: Múltiplos de 4pt (4, 8, 12, 16, 20, 24, 32, etc.)
- **Iconografía**: Usar SF Symbols (iOS) o Material Icons (Android/Web)
- **Animaciones**: Sutiles y rápidas (80-300ms), sin exceso de movimiento
- **Feedback háptico**: Vibraciones ligeras en interacciones principales

## Próximos Pasos

1. Crear componentes de gráficos (ProgressRing, BarChart, PieChart, LineChart)
2. Implementar pantalla Home con anillos de progreso
3. Implementar pestaña Finanzas con gráficos
4. Implementar pestaña Salud con integración HealthKit
5. Implementar pestaña Productividad
6. Implementar pestaña Mente y Asunción
7. Implementar pestaña Perfil
8. Integrar con API de Supabase
9. Integrar con bot de Telegram
