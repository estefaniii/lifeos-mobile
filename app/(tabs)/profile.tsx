import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, Switch, Alert, TextInput, Share, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { applyReminderSettings, useNotificationSetup, hasNotificationPermission, type ReminderSettings } from '@/hooks/use-notifications';
import { useThemeContext } from '@/lib/theme-provider';

/**
 * Profile & Settings Screen
 * 
 * Displays user profile and settings:
 * - User information
 * - Notification preferences
 * - HealthKit settings (iOS)
 * - Data export
 */
export default function ProfileScreen() {
  const colors = useColors();
  const { user, logout, refresh } = useAuth();
  const { colorScheme, toggleColorScheme } = useThemeContext();

  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<'femenino' | 'masculino' | 'otro'>((user as any)?.gender || 'femenino');
  const [isUpdating, setIsUpdating] = useState(false);

  // Re-sync local state when user data updates (e.g. after refresh)
  useEffect(() => {
    if (user?.name) setName(user.name);
    if ((user as any)?.gender) {
      setGender((user as any).gender);
    } else if (Platform.OS === 'web') {
      // Fallback: load from localStorage
      try {
        const stored = localStorage.getItem('lifeos_gender');
        if (stored === 'femenino' || stored === 'masculino' || stored === 'otro') {
          setGender(stored);
        }
      } catch {}
    }
  }, [user?.name, (user as any)?.gender]);

  const [healthKitEnabled, setHealthKitEnabled] = useState(false);

  const [reminders, setReminders] = useState<ReminderSettings>({
    water: true,
    breaks: true,
    finances: false,
    affirmations: true,
    habits: true,
    sleep: true,
  });

  const { getSettings, sendTest } = useNotificationSetup();

  // Load stored settings on mount
  useEffect(() => {
    const stored = getSettings();
    setReminders(stored);
  }, []);

  const handleReminderToggle = async (key: keyof ReminderSettings, val: boolean) => {
    const updated = { ...reminders, [key]: val };
    setReminders(updated);
    await applyReminderSettings(updated);
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        try {
          await logout();
        } catch {
          window.alert('No se pudo cerrar la sesión');
        }
      }
      return;
    }
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', onPress: () => { } },
      {
        text: 'Cerrar sesión',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar la sesión');
          }
        },
      },
    ]);
  };


  const handleUpdateName = async () => {
    if (!name.trim()) return;
    if (!user?.id) {
      Alert.alert('Error', 'No se encontró tu sesión. Intenta cerrar sesión y volver a entrar.');
      return;
    }
    setIsUpdating(true);
    try {
      const userId = String(user.id);
      console.log('[Profile] Saving name for userId:', userId, 'name:', name.trim(), 'gender:', gender);

      // Always upsert — creates row if missing, updates if exists
      const { error, data } = await supabase
        .from('users')
        .upsert({
          id: userId,
          name: name.trim(),
          gender,
          email: user?.email || '',
          last_active: new Date().toISOString()
        }, { onConflict: 'id' })
        .select();

      console.log('[Profile] Upsert result:', { error, data });

      if (error) throw error;

      // Force refresh auth context to pick up new name
      await refresh();
      Alert.alert('Listo', `Ahora te llamaré ${name.trim()}`);
    } catch (error: any) {
      console.error('[Profile] Error actualizando perfil:', error);
      Alert.alert('Error', `No se pudo guardar: ${error?.message || 'desconocido'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    try {
      const [transactions, health, mental, affirmations, projects, productivity] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('health_metrics').select('*').eq('user_id', user.id),
        supabase.from('mental_logs').select('*').eq('user_id', user.id),
        supabase.from('affirmations').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('productivity_logs').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, name: user.name, email: user.email },
        transactions: transactions.data || [],
        health_metrics: health.data || [],
        mental_logs: mental.data || [],
        affirmations: affirmations.data || [],
        projects: projects.data || [],
        productivity_logs: productivity.data || [],
      };

      const json = JSON.stringify(exportData, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: json, title: 'LifeOS Export' });
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron exportar los datos');
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="pb-32">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Perfil</Text>
          <Text className="text-sm text-muted mt-1" style={{ color: '#A1A1AA' }}>Tu centro de vida personal</Text>
        </View>

        {/* User Info Card */}
        <View className="mx-6 mb-8 bg-surface border border-border rounded-[28px] p-6">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(20,184,166,0.1)', borderWidth: 2, borderColor: 'rgba(20,184,166,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 30 }}>{gender === 'masculino' ? '👑' : gender === 'otro' ? '✨' : '👸'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ color: '#FAFAFA', fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{user?.name || user?.email?.split('@')[0] || 'Usuario'}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{user?.email || ''}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(63,63,70,0.5)', marginBottom: 18 }} />

          <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Mi nombre</Text>
          <TextInput
            style={[{ backgroundColor: '#09090B', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#FAFAFA', fontSize: 14 }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
            placeholder="¿Cómo quieres que te llame?"
            placeholderTextColor={colors.muted}
            value={name || ''}
            onChangeText={(text) => setName(text)}
          />
          <Pressable
            onPress={handleUpdateName}
            disabled={isUpdating}
            style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#14B8A6', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10, opacity: isUpdating ? 0.5 : 1 }}
          >
            <Text style={{ color: '#09090B', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{isUpdating ? '...' : 'Guardar'}</Text>
          </Pressable>

          <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '700', marginTop: 22, marginBottom: 10 }}>Género</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['femenino', 'masculino', 'otro'] as const).map((g) => {
              const selected = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={async () => {
                    setGender(g);
                    if (!user?.id) return;
                    try {
                      const { error } = await supabase
                        .from('users')
                        .update({ gender: g, last_active: new Date().toISOString() })
                        .eq('id', String(user.id));
                      if (error) {
                        await supabase.from('users').upsert({
                          id: String(user.id),
                          name: user.name || '',
                          email: user.email || '',
                          gender: g,
                          last_active: new Date().toISOString(),
                        }, { onConflict: 'id' });
                      }
                      await refresh();
                      if (Platform.OS === 'web') {
                        try { localStorage.setItem('lifeos_gender', g); } catch {}
                      }
                    } catch (err) {
                      console.error('[Profile] Gender save error:', err);
                    }
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    backgroundColor: selected ? '#14B8A6' : '#09090B',
                    borderColor: selected ? '#14B8A6' : '#27272A',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: selected ? '#fff' : '#FAFAFA' }}>
                    {g === 'femenino' ? '👸 Femenino' : g === 'masculino' ? '👑 Masculino' : '✨ Otro'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reminders Section */}
        <View className="px-6 mb-8">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>Recordatorios Inteligentes</Text>
            {Platform.OS === 'web' && (
              <Pressable
                onPress={sendTest}
                style={{ backgroundColor: 'rgba(20,184,166,0.15)', borderWidth: 1, borderColor: 'rgba(20,184,166,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}
              >
                <Text style={{ color: '#14B8A6', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Probar</Text>
              </Pressable>
            )}
          </View>
          <View className="glass-card rounded-3xl p-2">
            {[
              { id: 'habits', label: 'Hábitos Diarios', sub: '9:00 AM', icon: '🎯' },
              { id: 'water', label: 'Hidratación', sub: 'Cada 2 horas', icon: '💧' },
              { id: 'sleep', label: 'Hora de Dormir', sub: '10:30 PM', icon: '🌙' },
              { id: 'affirmations', label: 'Afirmaciones', sub: '8:00 AM y 10:00 PM', icon: '✨' },
              { id: 'breaks', label: 'Pausas Activas', sub: 'Cada 90 min', icon: '🏃' },
              { id: 'finances', label: 'Resumen Financiero', sub: '8:00 PM', icon: '💰' },
            ].map((item, idx, arr) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 14,
                  borderBottomWidth: idx !== arr.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(63,63,70,0.3)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(161,161,170,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ color: '#A1A1AA', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{item.sub}</Text>
                  </View>
                </View>
                <Switch
                  value={reminders[item.id as keyof ReminderSettings]}
                  onValueChange={(val) => handleReminderToggle(item.id as keyof ReminderSettings, val)}
                  trackColor={{ false: '#3F3F46', true: '#14B8A6' }}
                  thumbColor={reminders[item.id as keyof ReminderSettings] ? '#fff' : '#A1A1AA'}
                />
              </View>
            ))}
          </View>
          {Platform.OS === 'web' && (
            <Text style={{ color: hasNotificationPermission() ? '#14B8A6' : '#52525B', fontSize: 10, textAlign: 'center', marginTop: 8 }}>
              {hasNotificationPermission()
                ? '✅ Permiso activo. En web verás los recordatorios mientras la app esté abierta; para avisos con la app cerrada, usa la app móvil.'
                : 'Las notificaciones web requieren permiso del navegador. Toca "Probar" para activarlas.'}
            </Text>
          )}
        </View>

        {/* Health Section (solo iOS — Apple Health no aplica en web) */}
        {Platform.OS === 'ios' && (
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-foreground mb-4" style={{ color: '#FAFAFA' }}>Salud & Sync</Text>

          <View className="glass-card rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground" style={{ color: '#FAFAFA' }}>Sincronizar Apple Health</Text>
                <Text className="text-xs text-muted mt-1" style={{ color: '#A1A1AA' }}>Conecta con tus Atajos de iOS (Webhook)</Text>
              </View>
              <Switch
                value={healthKitEnabled}
                onValueChange={setHealthKitEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {healthKitEnabled ? (
              <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                <Text className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                  URL del Webhook (Para Atajos)
                </Text>
                <TextInput
                  className="bg-background border border-primary/20 rounded-xl px-4 py-3 text-xs text-foreground font-mono"
                  style={{ color: '#FAFAFA' }}
                  value={`TuDominioVercel.com/api/health-sync?user=${user?.id}`}
                  editable={false}
                />
                <Text className="text-[10px] text-muted mt-2 leading-relaxed" style={{ color: '#A1A1AA' }}>
                  Copia esta URL y configúrala en un Atajo de iOS que envíe un POST diario con tus pasos, sueño y energía quemada, dado que Apple bloquea la lectura directa a Web Apps (PWA).
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-muted" style={{ color: '#A1A1AA' }}>
                Activa esta opción para obtener la URL del webhook y sincronizar tu salud automáticamente desde iOS.
              </Text>
            )}
          </View>
        </View>
        )}

        {/* Sistema */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-foreground mb-4" style={{ color: colors.text }}>Sistema</Text>

          {/* Theme Toggle */}
          <Pressable
            onPress={handleExportData}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>Exportar Datos</Text>
              <Text style={{ color: colors.muted, fontSize: 10 }}>Descarga todos tus datos en JSON</Text>
            </View>
            <Text style={{ fontSize: 20 }}>⬇️</Text>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Zona de Peligro</Text>

          <Pressable
            onPress={handleSignOut}
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 15 }}>Cerrar Sesión</Text>
          </Pressable>

          {user?.email && (
            <Text style={{ color: '#52525B', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              Sesión iniciada como {user.email}
            </Text>
          )}
        </View>

        {/* Version Info */}
        <View className="px-6 mb-8 items-center">
          <Text className="text-xs text-muted" style={{ color: '#A1A1AA' }}>LifeOS · v2.2</Text>
          <Text className="text-xs text-muted mt-1" style={{ color: '#A1A1AA' }}>Tu centro de vida personal</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
