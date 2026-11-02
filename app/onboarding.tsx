import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Titulo, TINTA } from '@/components/decor';

type Gender = 'femenino' | 'masculino' | 'otro';

// Ámbar de Inicio, con texto oscuro encima
const ACENTO = '#FFB547';
const ELEVADO = '#2A2521';

// Dos pasos: el nombre y cómo dirigirse a ella. Las notificaciones ya no se
// piden aquí: se activan desde Perfil.
const PASOS = 2;

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<Gender>('femenino');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await supabase.from('users').upsert({
        id: user.id,
        name: name.trim() || null,
        gender,
        onboarding_completed: true,
        last_active: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (Platform.OS === 'web' && user?.id) {
        try {
          localStorage.setItem('lifeos_gender', gender);
          localStorage.setItem(`lifeos_onboarded_${user.id}`, 'true');
        } catch {}
      }

      await refresh();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('[Onboarding] Error:', err);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  const boton = {
    marginTop: 24,
    width: '100%' as const,
    minHeight: 54,
    backgroundColor: ACENTO,
    borderRadius: 27,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TINTA.fondo }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>

        {/* Por dónde va */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 36 }} accessibilityLabel={`Paso ${step + 1} de ${PASOS}`}>
          {Array.from({ length: PASOS }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 28 : 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: i <= step ? ACENTO : TINTA.borde,
              }}
            />
          ))}
        </View>

        {step === 0 && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 380 }}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 88, height: 88, borderRadius: 24, marginBottom: 24 }}
            />
            <Titulo size={32} style={{ textAlign: 'center' }}>Bienvenida a LifeOS</Titulo>
            <Text style={{ fontSize: 15, color: TINTA.suave, textAlign: 'center', marginTop: 10, marginBottom: 28, lineHeight: 22 }}>
              Tu ejercicio, tu comida, tus hobbies y tu dinero, en un solo lugar. Primero, ¿cómo te llamas?
            </Text>

            <TextInput
              style={{
                width: '100%',
                minHeight: 54,
                backgroundColor: TINTA.tarjeta,
                borderWidth: 1,
                borderColor: TINTA.borde,
                borderRadius: 18,
                paddingHorizontal: 20,
                color: TINTA.texto,
                fontSize: 17,
                textAlign: 'center',
              }}
              placeholder="Tu nombre"
              placeholderTextColor={TINTA.suave}
              value={name}
              onChangeText={setName}
              onSubmitEditing={() => setStep(1)}
              autoFocus
            />

            <Pressable onPress={() => setStep(1)} accessibilityRole="button" style={boton}>
              <Text style={{ color: TINTA.fondo, fontSize: 16, fontWeight: '800' }}>Continuar</Text>
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 380 }}>
            <Titulo size={32} style={{ textAlign: 'center' }}>{name.trim() ? `Hola, ${name.trim()}` : 'Hola'}</Titulo>
            <Text style={{ fontSize: 15, color: TINTA.suave, textAlign: 'center', marginTop: 10, marginBottom: 28, lineHeight: 22 }}>
              ¿Cómo quieres que la app se dirija a ti?
            </Text>

            <View style={{ width: '100%', gap: 10 }}>
              {([
                { value: 'femenino' as Gender, emoji: '👸', label: 'Femenino', sub: 'Te hablo en femenino' },
                { value: 'masculino' as Gender, emoji: '👑', label: 'Masculino', sub: 'Te hablo en masculino' },
                { value: 'otro' as Gender, emoji: '✨', label: 'Neutro', sub: 'Sin género' },
              ]).map((opt) => {
                const selected = gender === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGender(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      minHeight: 64,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: selected ? ACENTO : TINTA.borde,
                      backgroundColor: TINTA.tarjeta,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: selected ? ACENTO : ELEVADO, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '700' }}>{opt.label}</Text>
                      <Text style={{ color: TINTA.suave, fontSize: 13, marginTop: 2 }}>{opt.sub}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleFinish}
              disabled={saving}
              accessibilityRole="button"
              style={{ ...boton, opacity: saving ? 0.6 : 1 }}
            >
              <Text style={{ color: TINTA.fondo, fontSize: 16, fontWeight: '800' }}>
                {saving ? 'Guardando…' : 'Empezar'}
              </Text>
            </Pressable>

            <Pressable onPress={() => setStep(0)} disabled={saving} accessibilityRole="button"
              style={{ marginTop: 8, minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' }}>
              <Text style={{ color: TINTA.suave, fontSize: 14, fontWeight: '600' }}>← Cambiar el nombre</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
