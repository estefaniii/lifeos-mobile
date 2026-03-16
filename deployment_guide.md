# Guía de Despliegue LifeOS v2.1 🚀

Sigue estos pasos para subir tu aplicación a la nube y usarla como una App nativa en tu celular.

## 1. Subir a GitHub
1. Abre la terminal en la carpeta `lifeos_mobile`.
2. Inicializa el repositorio:
   ```bash
   git init
   git add .
   git commit -m "feat: LifeOS v2.1 Premium Release"
   ```
3. Crea un repositorio en GitHub (ej: `lifeos-app`).
4. Conecta y sube:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/lifeos-app.git
   git branch -M main
   git push -u origin main
   ```

## 2. Desplegar en Vercel
1. Ve a [Vercel](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **"Add New"** -> **"Project"**.
3. Importa tu repositorio `lifeos-app`.
4. **IMPORTANTE: Configura las Variables de Entorno**.
   Copia el contenido de tu archivo `.env` en la sección "Environment Variables" de Vercel:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - (Cualquier otra que uses)
5. Haz clic en **Deploy**. Vercel detectará automáticamente que es un proyecto de Expo/Next.js.

## 3. Instalar como PWA (App en el Celular)
Una vez que Vercel te dé tu URL (ej: `https://lifeos-app.vercel.app`):
1. Abre el link en **Safari (iOS)** o **Chrome (Android)** desde tu celular.
2. En iOS: Dale al botón de **Compartir** -> **"Agregar a inicio"** (Add to Home Screen).
3. En Android: Dale a los **tres puntos** -> **"Instalar aplicación"**.
4. ¡Listo! Ahora aparecerá el icono de LifeOS en tu pantalla de inicio y se abrirá sin barras de navegador, como una app real.

## 4. Telegram Bot
Recuerda que para que el bot de Telegram funcione, debe estar corriendo en un servidor (puedes usar Railway o render.com para el bot específicamente, ya que requiere un proceso Node.js constante).
