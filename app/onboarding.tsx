import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { requestNotificationPermissions } from '@/hooks/use-notifications';

type Gender = 'femenino' | 'masculino' | 'otro';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('femenino');
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;

  const handleFinish = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Save profile
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

  const handleNotifications = async () => {
    await requestNotificationPermissions();
    setStep(totalSteps - 1);
  };

  const skipNotifications = () => {
    setStep(totalSteps - 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090B' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>

        {/* Progress dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 40 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === step ? '#14B8A6' : i < step ? '#14B8A6' : '#27272A',
                opacity: i <= step ? 1 : 0.4,
              }}
            />
          ))}
        </View>

        {/* Step 0: Welcome + Name */}
        {step === 0 && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 360 }}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 24 }}
            />
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FAFAFA', textAlign: 'center', marginBottom: 8 }}>
              Bienvenida a LifeOS
            </Text>
            <Text style={{ fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
              Tu centro de control personal con IA.{'\n'}Primero, cuéntanos cómo te llamas.
            </Text>

            <TextInput
              style={{
                width: '100%',
                backgroundColor: '#18181B',
                borderWidth: 1,
                borderColor: '#27272A',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 16,
                color: '#FAFAFA',
                fontSize: 16,
                textAlign: 'center',
              }}
              placeholder="Tu nombre"
              placeholderTextColor="#52525B"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Pressable
              onPress={() => setStep(1)}
              style={{
                marginTop: 24,
                width: '100%',
                backgroundColor: '#14B8A6',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Continuar</Text>
            </Pressable>
          </View>
        )}

        {/* Step 1: Gender */}
        {step === 1 && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 360 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>
              {gender === 'masculino' ? '👑' : gender === 'otro' ? '✨' : '👸'}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FAFAFA', textAlign: 'center', marginBottom: 8 }}>
              {name ? `¡Hola, ${name}!` : '¡Hola!'}
            </Text>
            <Text style={{ fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
              Elige cómo quieres que te hable{'\n'}tu AI Coach.
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
              {([
                { value: 'femenino' as Gender, label: '👸 Femenino', sub: '"Reina, tu deseo ya es tuyo"' },
                { value: 'masculino' as Gender, label: '👑 Masculino', sub: '"Rey, asume tu poder"' },
                { value: 'otro' as Gender, label: '✨ Neutro', sub: '"Tu potencial es infinito"' },
              ]).map((opt) => {
                const selected = gender === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGender(opt.value)}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: selected ? '#14B8A6' : '#27272A',
                      backgroundColor: selected ? 'rgba(20,184,166,0.1)' : '#18181B',
                    }}
                  >
                    <Text style={{ color: '#FAFAFA', fontSize: 16, fontWeight: '700' }}>{opt.label}</Text>
                    <Text style={{ color: '#71717A', fontSize: 12, marginTop: 4 }}>{opt.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setStep(2)}
              style={{
                marginTop: 24,
                width: '100%',
                backgroundColor: '#14B8A6',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Continuar</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2: Notifications + Finish */}
        {step === 2 && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 360 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FAFAFA', textAlign: 'center', marginBottom: 8 }}>
              Recordatorios
            </Text>
            <Text style={{ fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 12, lineHeight: 20 }}>
              Activa las notificaciones para recibir{'\n'}recordatorios de agua, hábitos y sueño.
            </Text>

            <View style={{ width: '100%', backgroundColor: '#18181B', borderRadius: 16, padding: 16, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: '#27272A' }}>
              {[
                { icon: '💧', label: 'Hidratación', sub: 'Cada 2 horas' },
                { icon: '🎯', label: 'Hábitos', sub: '9:00 AM' },
                { icon: '🌙', label: 'Hora de dormir', sub: '10:30 PM' },
                { icon: '✨', label: 'Afirmaciones', sub: '8:00 AM y 10:00 PM' },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FAFAFA', fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ color: '#71717A', fontSize: 11 }}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              onPress={async () => {
                await handleNotifications();
                await handleFinish();
              }}
              disabled={saving}
              style={{
                width: '100%',
                backgroundColor: '#14B8A6',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {saving ? 'Configurando...' : 'Activar y Empezar'}
              </Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                skipNotifications();
                await handleFinish();
              }}
              disabled={saving}
              style={{ marginTop: 16 }}
            >
              <Text style={{ color: '#71717A', fontSize: 14 }}>Ahora no, empezar sin notificaciones</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
