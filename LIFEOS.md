# LifeOS Mobile — Documentación de la app

> La app de la **vida personal** de Estéfani: ejercicio, comida, finanzas personales, hábitos, hobbies, notas e historial.
> Guárdalo y reléelo en vez de volver al chat.

_Última actualización: 2026-11-01_

---

## 1. Qué es (y qué no)

Una sola usuaria (Estéfani), PWA + móvil. Estéfani tiene tres apps separadas y no se mezclan:

| App | Qué lleva |
|---|---|
| **LifeOS** (esta) | Ejercicio, comida, finanzas personales, hábitos con racha, hobbies y obras, notas, historial |
| **Luni** | Trabajo: clientes, contenido, facturas, proyectos. También Idiomas y Estudio, por ahora |
| **Presence** | Lo espiritual: meditación guiada, visualización, afirmaciones |

El trabajo de agencia (clientes, tareas, calendario de publicación) salió de aquí en el commit «LifeOS solo vida personal». Las tablas `clients`, `tasks` y `posts` siguen en la base, sin uso.

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
```
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

**Menú inferior** (`components/floating-tab-bar.tsx`, pestañas en `constants/tabs.ts`): una pastilla flotante a 12 px del borde, encima de la zona segura del iPhone. Cada pestaña tiene su color.

1. 🏠 **Inicio** (`index.tsx`): saludo y fecha, «Cómo vas hoy» (anillos), **Anotar rápido** (agua, meditar, gym, yoga), hidratación, hábitos, metas de ahorro y resumen semanal. Arriba: Historial, Salud y Perfil.
2. 🏃‍♀️ **Ejercicio** (`exercise.tsx`):
   - **Rutinas:** 8 zonas con foto y al menos 3 rutinas cada una (Suave, Completa y Express). Reproductor paso a paso con descanso y «Ver cómo se hace».
   - **Música para entrenar** por zona.
   - **Programas y retos:** 6 retos de 21 días (`constants/retos.ts`). Al elegir uno se guarda como programa y se va marcando día a día; cada día abre su rutina. También hay planes de otra persona con su video por día.
3. 🍽️ **Comida** (`food.tsx`):
   - **Semana:** plan de 7 días × 4 momentos. Con **Armar mi semana** eliges recetas, se reparten sin repetir dos días seguidos y los ingredientes van a Compras sin duplicados (`lib/semana-comida.ts`). El plan de hoy tiene el check **«La comí»**, que queda en el Historial.
   - **Recetas:** 31 con foto, buscador y filtros.
   - **Compras.**
4. 🎨 **Hobbies** (`hobbies.tsx`): hobbies con meta semanal y sesiones; **Obras en curso**, con estado, progreso y fotos (polaroids).
5. 💰 **Finanzas** (`finances.tsx`): transacciones, presupuestos, metas, recurrentes.
6. 📄 **Notas** (`notes.tsx`).

**Rutas ocultas:** `history` (**Historial**: todo lo hecho por día y con hora), `health` (Salud, con agua, sueño y hábitos), `profile`, `reports`, `timeline`.

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
- Sin uso, de cuando había trabajo: `clients`, `tasks`, `posts`, `projects`, `productivity_logs`

Todas con **RLS**: cada usuario solo ve lo suyo.

**El historial no copia nada:** lee `life_logs`, `exercise_sessions`, `habit_logs`, `mental_logs` y `hobby_sessions` y los junta al leer. La única excepción es el agua: cada vaso va a `life_logs` y el total del día se sigue sumando en `health_metrics.water_ml`, porque lo leen los anillos, Salud y el reporte.

## 8. Historial de cambios

- **1-nov-2026**:
  - Menú flotante y zona segura real en web.
  - 31 recetas, Armar mi semana con compras y check.
  - Registros con hora e Historial.
  - Hobbies y obras con fotos (vienen de Luni, que los esconde).
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

- Notificaciones con la app cerrada: solo en app nativa con push.
- Modo claro de verdad: hoy es oscuro solamente.
- Decidir si Idiomas y Estudio pasan de Luni a LifeOS.
- La hora de inicio del día: hoy todo corta a medianoche. Si se quiere que la 1 a. m. cuente como el día anterior (como en Luni), hay que hacerlo en `lib/registros.ts` y en los hooks a la vez.

## 10. Trampas y notas

- **Fechas:** `fechaLocal()` de `lib/registros.ts`. `toISOString().split('T')[0]` da la fecha UTC y en Panamá (UTC-5) salta de día a las 7 p. m. Quedan usos en finanzas y productividad, solo para rangos aproximados.
- **Zona segura en web:** el layout raíz forzaba 0 y solo la cambiaba si llegaba un mensaje del iframe de Manus. Ahora se mide con `env(safe-area-inset-*)` (`lib/_core/web-safe-area.ts`), y eso necesita `viewport-fit=cover` en `app/+html.tsx`.
- **Menú flotante:** cada pantalla deja `paddingBottom: 150` y los botones flotantes van a `bottom: 110` o más.
- **Videos y música:** son búsquedas de YouTube y Spotify, no IDs fijos. Un ID escrito a mano se rompe cuando borran el video.
- **Fotos de obras:** el bucket es privado y se ven con enlaces firmados de una hora (`useFotosFirmadas`).
- **`.env`** tiene las credenciales. No se sube ni se borra.
- Mac con 8 GB de RAM: un solo servidor de desarrollo a la vez.
- `app/(tabs)/_layout.tsx` decide qué rutas existen. `href: null` oculta una del menú, y el menú solo pinta las que están en `constants/tabs.ts`.
