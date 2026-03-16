import { ExpoRequest } from 'expo-router/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase de servidor
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
// Recomendado: usar SERVICE_ROLE_KEY o ANON_KEY para servidor
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: ExpoRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user');

    if (!userId) {
      return Response.json(
        { error: 'Missing user ID in query parameters (e.g. ?user=123)' },
        { status: 400 }
      );
    }

    const body = await req.json();
    
    // El atajo de iOS enviará el objeto:
    // { "steps": 5000, "sleep_minutes": 420, "exercise_minutes": 30 }
    const { steps, sleep_minutes, exercise_minutes } = body;

    const today = new Date().toISOString().split('T')[0];

    // Primero obtener el registro actual de hoy
    const { data: currentRecord } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Actualizar o insertar con los nuevos datos
    const { error } = await supabase
      .from('health_metrics')
      .upsert({
        user_id: userId,
        date: today,
        // Mantener datos existentes por si se actualizó agua o gimnasio desde la app manual
        ...(currentRecord || {}),
        // Sobrescribir los de Apple Health
        steps: steps || currentRecord?.steps || 0,
        sleep_minutes: sleep_minutes || currentRecord?.sleep_minutes || 0,
        exercise_minutes: exercise_minutes || currentRecord?.exercise_minutes || 0,
      }, { onConflict: 'user_id,date' });

    if (error) {
      console.error('Error sincronizando Apple Health:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Health synced successfully!' });
  } catch (error: any) {
    console.error('Error fetching request data:', error);
    return Response.json(
      { error: 'Invalid request body or processing error', details: error.message },
      { status: 400 }
    );
  }
}
