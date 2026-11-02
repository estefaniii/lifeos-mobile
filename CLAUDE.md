# LifeOS Mobile

App de la **vida personal** de Estéfani: ejercicio, comida, finanzas personales, hábitos, hobbies, notas e historial.
**Solo vida personal.** El trabajo (clientes, contenido, facturas, proyectos) vive en Luni; lo espiritual (meditación guiada, afirmaciones, visualización) en Presence. No traigas nada de eso aquí.

Repo: `github.com/estefaniii/lifeos-mobile` · rama `main`. El `name` del package.json es `app-template`, ignóralo.
Documento largo: `LIFEOS.md` (pantallas, tablas, trampas). Léelo antes de tocar algo grande.

## Stack
**Expo** (React Native, corre como web PWA en Vercel) + **Supabase** directo desde el cliente con React Query.
El servidor tRPC/Drizzle de `server/` existe pero la web no lo usa.

## Comandos
```bash
npm run dev:metro    # solo Metro (:8081): lo que hace falta para la web
npm run dev          # servidor + Metro
npm run test         # vitest run
npx tsc --noEmit     # el error de components/ui/collapsible.tsx ya existía
npm install --legacy-peer-deps   # sin el flag, npm choca con victory-native
```

## Entorno
`DATABASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`, `JWT_SECRET`.
Las variables que el cliente necesita **deben** llevar el prefijo `EXPO_PUBLIC_`.

## Reglas que ya costaron
- **Fechas:** `fechaLocal()` de `lib/registros.ts`, nunca `toISOString().split('T')[0]` (en Panamá salta de día a las 7 p. m.).
- **Cambios de esquema en Supabase de producción:** se consultan con Estéfani antes. El SQL va en `supabase/*.sql`.
- **No hacer push** sin que Estéfani diga «súbelo»: el push a `main` publica en Vercel.
- El menú inferior es `components/floating-tab-bar.tsx`; sus pestañas, en `constants/tabs.ts`. Cada pantalla deja `paddingBottom: 150`.
