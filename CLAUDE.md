# LifeOS

La app de la **vida personal** de Estéfani: ejercicio, comida, finanzas personales, hábitos, hobbies y obras, sueño y agua, notas e historial. Una sola usuaria, PWA + móvil.

Este es el ÚNICO documento de LifeOS (el 1-nov-2026 se unificaron aquí `LIFEOS.md` y el `CLAUDE.md` corto, y se borraron las guías viejas). Aparte quedan `HEALTHKIT_SETUP.md` (HealthKit, todavía sin usar) y `DASHBOARD_QUERIES.md` (consultas de referencia).

El `name` del package.json es `app-template`: ignóralo.

## 1. Las tres apps de Estéfani

Acordado el 1-nov-2026, para que nada se mezcle. **Solo vida personal aquí.** Antes de añadir algo, mirar si va en otra; si cabe en una que ya existe, ampliarla en vez de abrir una app nueva.

| App | Qué cuida | Dónde |
|---|---|---|
| **Presence** | Lo espiritual: meditación guiada, visualización, ley de la suposición, afirmaciones | `~/Downloads/agente de páginas web/plantillas/presence` |
| **Luni** | El trabajo: clientes y su contenido, facturas, proyectos. También Idiomas y Estudio, por ahora | `~/Downloads/luni` · lunii.vercel.app |
| **LifeOS** (esta) | Ejercicio, comida, finanzas personales, hábitos con racha, hobbies y obras, sueño y agua, notas, historial | esta carpeta |

El trabajo de agencia (clientes, tareas, calendario de publicación) salió de aquí en el commit «LifeOS solo vida personal».

Ideas de apps nuevas que salieron (ninguna empezada): música y canciones (la favorita de Estéfani), casa, viajes, ciclo y bienestar, regalos y personas, tienda Armony, mascota.

## 2. Dónde vive

| Pieza | Dónde |
|---|---|
| Código local | `~/Downloads/Mis Apps Web/lifeos_mobile` |
| GitHub | `estefaniii/lifeos-mobile` (rama `main`) |
| Deploy (web) | Vercel, proyecto **`lifeos-mobilee`** → **https://lifeos-mobilee.vercel.app** |
| Base de datos + login | **Supabase**, proyecto ref `gwtwrqemyemstfajfjjv` (us-west-2) |

**Flujo:** editas → `git push` a `main` → Vercel reconstruye solo (~2-3 min). **No se hace push sin que Estéfani diga «súbelo».**

## 3. Stack

- **Expo / React Native** + **expo-router** (web PWA y app móvil)
- **Supabase** (Postgres + Auth + Storage). Se lee y escribe **directo desde el cliente**, con RLS.
- **React Query** para datos
- NativeWind + estilos inline. Títulos en **Bricolage Grotesque** (`@expo-google-fonts`)
- tRPC + Drizzle en `server/`: existe, la web no lo usa

## 4. Cómo correrla

```bash
cd ~/Downloads/"Mis Apps Web/lifeos_mobile"
npm run dev:metro        # Metro en http://localhost:8081
npm run test             # vitest
npm install --legacy-peer-deps   # siempre con el flag (Vercel también lo usa)
npx tsc --noEmit         # el error de components/ui/collapsible.tsx ya existía
```

**Entorno:** `DATABASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`, `JWT_SECRET`. Lo que el cliente necesita **debe** llevar el prefijo `EXPO_PUBLIC_`.
`localhost` es otro origen que Vercel: hay que iniciar sesión otra vez (mismo Supabase, mismos datos).

## 5. Acceso directo a la base de datos

`DATABASE_URL` en `.env` (Session pooler, IPv4). Para SQL desde la terminal, un archivo `.cjs`:
```js
require('dotenv').config({ path: process.cwd() + '/.env' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
```
```bash
NODE_PATH="$(pwd)/node_modules" node mi-script.cjs
```
Nunca `node -e "..."` en una línea: bash se come los `${...}`. **Un cambio de esquema en producción se consulta con Estéfani antes.**

## 6. Estructura

**Navegación** (secciones, colores e iconos en `constants/tabs.ts`):
- **Celular:** una barra flotante abajo con Inicio, Ejercicio, Comida, Hobbies y Finanzas (`components/floating-tab-bar.tsx`), a 12 px del borde y encima de la zona segura del iPhone. Arriba a la derecha, un botón con tu foto y ☰ abre un panel desde la derecha con tu perfil, Notas, Historial, Sueño y agua y todo lo demás (`components/menu-lateral.tsx`). Las cabeceras dejan `paddingRight: 110` para ese botón.
- **Computadora (≥ 1024 px):** columna fija a la izquierda con todas las secciones y tu perfil abajo. Sin barra inferior ni botón de menú.

1. 🏠 **Inicio** (`index.tsx`): saludo y fecha, «Cómo vas hoy» (anillos), **Anotar rápido** (agua, meditar, gym, yoga), hidratación, hábitos, metas de ahorro y resumen semanal. Arriba: Historial, Salud y Perfil.
2. 🏃‍♀️ **Ejercicio** (`exercise.tsx`):
   - **Rutinas:** 8 zonas con foto y al menos 3 rutinas cada una (Suave, Completa y Express). Reproductor paso a paso con descanso y «Ver cómo se hace».
   - **Música para entrenar** por zona.
   - **Programas y retos:** 6 retos de 21 días (`constants/retos.ts`). Al elegir uno se guarda como programa y se va marcando día a día; cada día abre su rutina. También hay planes de otra persona con su video por día.
3. 🍽️ **Comida** (`food.tsx`):
   - **Semana:** plan de 7 días × 4 momentos. Con **Armar mi semana** eliges recetas, se reparten sin repetir dos días seguidos y los ingredientes van a Compras sin duplicados (`lib/semana-comida.ts`). El plan de hoy tiene el check **«La comí»**, que queda en el Historial.
   - **Recetas:** 38 con foto, buscador y filtros.
   - **Compras:** agrupadas por pasillo del súper (`pasilloDe()` en `lib/semana-comida.ts`).
4. 🎨 **Hobbies** (`hobbies.tsx`): hobbies con meta semanal y sesiones; **Obras en curso**, con estado, progreso y fotos (polaroids).
5. 💰 **Finanzas** (`finances.tsx`): transacciones, presupuestos, metas, recurrentes.
6. 📄 **Notas** (`notes.tsx`).

**Desde el menú:**
- `history`: **Historial**, todo lo hecho por día y con hora.
- `health`: **Sueño y agua**. Ya no tiene macros, pasos ni sugerencias.
- `profile`: **Perfil**, con tu foto, tu nombre, los recordatorios a su hora y una copia de tus datos.

Fuera del menú quedan `reports` y `timeline`.

**Notificaciones push de verdad** (llegan con la app cerrada):
- Se activan desde Perfil, y Perfil también envía una prueba. Se guarda la suscripción del celular en `push_subscriptions`.
- Cada 5 minutos, `pg_cron` en Supabase llama a `/api/push` (Vercel, `api/push.ts`). La función mira qué recordatorios tocan en tu zona horaria (`lib/recordatorios.ts`) y los envía con `web-push`.
- `push_sent` evita mandar el mismo dos veces.
- En el iPhone solo funciona con LifeOS **añadida a la pantalla de inicio** (iOS 16.4+): el Perfil lo explica.
- El aviso se programa con `scripts/programar-push.cjs`, que lleva el secreto y no va en el SQL.
- Variables en Vercel: `EXPO_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET` y `DATABASE_URL`.

### Mapa de archivos

```
app/(tabs)/       pantallas (las de arriba)
components/
  floating-tab-bar.tsx   menú inferior
  decor.tsx              Titulo, Sticker, Chispa, Estrella, Sello y la paleta TINTA
  water-modal.tsx        registrar agua (Inicio y Salud)
  programas-ejercicio.tsx  retos y programas
hooks/
  use-registros.ts   registros con hora (life_logs) e historial
  use-hobbies.ts     hobbies, sesiones, obras y fotos
  use-vida.ts        ejercicio, plan de comidas, compras
  use-programas.ts   programas y retos
  use-habits.ts  use-health.ts  use-transactions.ts …
lib/
  registros.ts       fechas locales, agrupar por día (con pruebas)
  semana-comida.ts   repartir la semana y juntar ingredientes (con pruebas)
  _core/web-safe-area.ts  zona segura real en web
constants/  recetas.ts  ejercicios.ts  retos.ts  hobbies.ts  comida.ts  tabs.ts
supabase/   SQL de cada grupo de tablas
tests/      vitest
```

**Para agregar algo:** tabla en `supabase/*.sql` → hook en `hooks/` → pantalla.

## 7. Base de datos

- **users**: perfil
- **transactions**, **budgets**, **recurring_transactions**, **savings_goals**: finanzas
- **health_metrics**: sueño, agua (`water_ml`, el total del día) y ejercicio. **mental_logs**: estrés y meditación. **habits**, **habit_logs**
- **exercise_sessions**: cada rutina terminada. **exercise_programs**, **exercise_program_done**: programas, retos y días hechos (`programas-ejercicio.sql`)
- **meal_plan**, **shopping_items**: comida (`vida-personal.sql`)
- **life_logs**: registros rápidos con hora (agua, comida, meditación). **hobbies**, **hobby_sessions**, **craft_works**, **craft_work_images**: hobbies y obras. Bucket privado **`obras`** con las fotos en `<user_id>/<obra>/…` (`registros-hobbies.sql`, creado el 1-nov-2026)
- **notes**
- **progress_photos**: fotos de *Mi progreso*, en el bucket privado `progreso`. `user_settings.day_start_hour` guarda a qué hora empieza tu día (`progreso-dia.sql`).
- **Esquema `archivo`**: `clients`, `tasks`, `posts`, `projects`, `chat_messages` y `affirmations`, de cuando había trabajo y afirmaciones. Ya no las usa la app. Hay una copia en `respaldos/tablas-sin-uso-2026-11-01.json` (gitignored). Para borrarlas del todo: `drop schema archivo cascade;`. `productivity_logs` sigue en `public`, vacía, porque la lee `timeline`.

- **user_settings**: foto (bucket privado **`perfil`**), recordatorios y zona horaria. **push_subscriptions**: los celulares suscritos. **push_sent**: lo ya enviado, que solo toca el servidor (`perfil-push.sql`). Extensiones `pg_cron` y `pg_net` activas.

Todas con **RLS**: cada usuario solo ve lo suyo.

**El historial no copia nada:** lee `life_logs`, `exercise_sessions`, `habit_logs`, `mental_logs` y `hobby_sessions` y los junta al leer. La única excepción es el agua: cada vaso va a `life_logs` y el total del día se sigue sumando en `health_metrics.water_ml`, porque lo leen los anillos, Salud y el reporte.

## 8. Historial de cambios

- **1-nov-2026 (noche)**:
  - Los 8 hobbies de Luni pasan a LifeOS.
  - Hora de inicio del día, rachas de agua y de ejercicio con sticker.
  - Mi progreso, con fotos del cuerpo.
  - Liberar espacio en el Historial.
  - Notificaciones con el resumen del domingo y la copia del día 1.
  - Música con iconos y 16 listas.
  - 38 recetas, compras por pasillo y aviso de presupuesto al 80 %.
  - Tablas sin uso archivadas y su código borrado.
  - Modo claro.
- **1-nov-2026 (tarde)**:
  - Notificaciones push reales y Perfil con foto, sin «Zona de peligro».
  - Menú lateral en computadora y menú hamburguesa en el celular.
  - Sueño y agua, sin macros.
  - Música y videos que abren en el iPhone.
  - 36 recetas.
  - Paleta cálida en toda la app.
- **1-nov-2026**:
  - Menú flotante y zona segura real en web.
  - 31 recetas, Armar mi semana con compras y check.
  - Registros con hora e Historial.
  - Hobbies y obras con fotos (copiados de Luni; Luni todavía no los esconde).
  - Ejercicio con fotos, 27 rutinas, video, música y retos de 21 días.
  - Títulos en Bricolage Grotesque y stickers.
  - Fechas locales en toda la app.
- **28-oct-2026**:
  - LifeOS solo vida personal: Ejercicio y Comida, fuera Trabajo.
  - Recetas con foto.
  - Programas guiados.
  - RLS en todas las tablas.
- **Antes**:
  - Reactivada la base.
  - Notas, Insights y agua en vasos.
  - AI Coach quitado y modo oscuro solo.

## 9. Pendientes / ideas

- Notificaciones nativas con la app cerrada en iOS/Android: en web ya funcionan (push). En nativo, `expo-notifications` las programa en el teléfono.
- Decidir si Idiomas y Estudio pasan de Luni a LifeOS.
- Borrar del todo el esquema `archivo` cuando ya no haga falta: `drop schema archivo cascade;`.

## 10. Trampas y notas

- **Fechas:** `fechaLocal()` de `lib/registros.ts`. `toISOString().split('T')[0]` da la fecha UTC y en Panamá (UTC-5) salta de día a las 7 p. m. Quedan usos en finanzas y productividad, solo para rangos aproximados.
- **Zona segura en web:** el layout raíz forzaba 0 y solo la cambiaba si llegaba un mensaje del iframe de Manus. Ahora se mide con `env(safe-area-inset-*)` (`lib/_core/web-safe-area.ts`), y eso necesita `viewport-fit=cover` en `app/+html.tsx`.
- **Menú flotante:** cada pantalla deja `paddingBottom: 150` y los botones flotantes van a `bottom: 110` o más.
- **Videos y música:** son búsquedas de YouTube y Spotify, no IDs fijos. Un ID escrito a mano se rompe cuando borran el video. En la web se abren con un `<a target=_blank>` que se pulsa dentro del toque: `Linking.openURL` usa `window.open`, y el iPhone con la app instalada lo ignora.
- **Tema:** las dos paletas, oscura y clara cálida, están en `theme.config.js`. `lib/tema.ts` elige la que toca según Perfil → Apariencia: `localStorage` en web, `SecureStore` en el teléfono, leído al cargar.
  - De ahí salen `TINTA` (`components/decor.tsx`) y `useColors()`. Ningún hex de la base se escribe a mano.
  - El texto sobre un acento usa `TINTA.sobreAcento`, siempre oscuro. Un acento usado como texto sobre fondo claro pasa por `acentoTexto()`.
  - En web, cambiar de tema recarga la página.
- **Hora de inicio del día:** `setHoraInicioDia()` en `lib/registros.ts` desplaza `fechaLocal()`. La lee `useAjustes()` y se guarda también en `localStorage` para el primer render. Todo «hoy» tiene que pasar por `fechaLocal()`, o se contradice con el resto.
- **Liberar espacio:** `HISTORIAL_BORRABLE` en `hooks/use-registros.ts` dice qué se puede borrar. Nunca entran ahí dinero, hábitos (su definición), hobbies, obras, recetas ni notas.
- **`/api/*`:** la regla de `vercel.json` que manda todo a `index.html` excluye `/api/`; si no, la función de push devolvería la app.
- **Fotos de obras:** el bucket es privado y se ven con enlaces firmados de una hora (`useFotosFirmadas`).
- **`.env`** tiene las credenciales. No se sube ni se borra.
- Mac con 8 GB de RAM: un solo servidor de desarrollo a la vez.
- `app/(tabs)/_layout.tsx` decide qué rutas existen. `href: null` oculta una del menú, y el menú solo pinta las que están en `constants/tabs.ts`.
