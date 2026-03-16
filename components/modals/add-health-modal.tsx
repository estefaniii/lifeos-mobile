import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface AddHealthModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function AddHealthModal({ visible, onClose, userId }: AddHealthModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const [gym, setGym] = useState(false);
  const [yoga, setYoga] = useState(false);
  const [massage, setMassage] = useState(false);
  const [steps, setSteps] = useState('');
  const [waterMl, setWaterMl] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  useEffect(() => {
    if (visible) {
      setGym(false);
      setYoga(false);
      setMassage(false);
      setSteps('');
      setWaterMl('');
      setSleepHours('');
      setCalories('');
      setProtein('');
    }
  }, [visible]);

  const handleSave = async () => {
    const today = new Date().toISOString().split('T')[0];
    setIsLoading(true);
    try {
      const upsertData: Record<string, any> = { user_id: userId, date: today };

      if (gym) upsertData.gym_session = true;
      if (yoga) upsertData.yoga_session = true;
      if (massage) upsertData.massage_session = true;
      if (steps) upsertData.steps = parseInt(steps);
      if (waterMl) upsertData.water_ml = parseInt(waterMl);
      if (sleepHours) upsertData.sleep_minutes = Math.round(parseFloat(sleepHours) * 60);
      if (calories) { upsertData.calories = parseInt(calories); upsertData.meals_tracked = true; }
      if (protein) upsertData.protein_g = parseFloat(protein);

      // Check if a row already exists for today
      const { data: existing } = await supabase
        .from('health_metrics')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      let error: any = null;
      if (existing) {
        const { user_id, date, ...fields } = upsertData;
        ({ error } = await supabase.from('health_metrics').update(fields).eq('id', existing.id));
      } else {
        ({ error } = await supabase.from('health_metrics').insert(upsertData));
      }

      if (error) throw error;

      await queryClient.refetchQueries({ queryKey: ['today-health-metrics'] });
      await queryClient.refetchQueries({ queryKey: ['manual-health-entries'] });
      await queryClient.refetchQueries({ queryKey: ['health-metrics'] });

      Alert.alert('¡Listo!', 'Salud registrada 💪');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const ActivityToggle = ({ label, emoji, active, onToggle }: {
    label: string; emoji: string; active: boolean; onToggle: () => void;
  }) => (
    <Pressable
      onPress={onToggle}
      className={`flex-1 rounded-2xl p-4 items-center border-2 ${active ? 'bg-primary border-primary' : 'bg-surface border-transparent'}`}
    >
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className={`text-xs font-bold ${active ? 'text-background' : 'text-foreground'}`} style={{ color: active ? '#09090B' : '#FAFAFA' }}>{label}</Text>
    </Pressable>
  );

  const NumericField = ({ label, emoji, value, onChange, placeholder, unit }: {
    label: string; emoji: string; value: string; onChange: (v: string) => void; placeholder: string; unit: string;
  }) => (
    <View className="mb-4">
      <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2" style={{ color: '#A1A1AA' }}>{emoji} {label}</Text>
      <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 border border-border/50">
        <TextInput
          className="flex-1 text-foreground text-lg font-semibold"
          style={{ color: '#FAFAFA' }}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
        />
        <Text className="text-muted text-sm font-bold" style={{ color: '#A1A1AA' }}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-[40px] p-8 border-t border-white/10" style={{ maxHeight: '92%' }}>
          <View className="w-12 h-1.5 bg-muted/30 rounded-full self-center mb-6" />

          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Registro de Salud</Text>
              <Text className="text-xs text-muted mt-1" style={{ color: '#A1A1AA' }}>Completa lo que hiciste hoy</Text>
            </View>
            <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-surface items-center justify-center">
              <Text className="text-xl text-foreground" style={{ color: '#FAFAFA' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Actividades */}
            <Text className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Actividades</Text>
            <View className="flex-row gap-3 mb-6">
              <ActivityToggle label="Gimnasio" emoji="💪" active={gym} onToggle={() => setGym(!gym)} />
              <ActivityToggle label="Yoga" emoji="🧘" active={yoga} onToggle={() => setYoga(!yoga)} />
              <ActivityToggle label="Masaje" emoji="💆" active={massage} onToggle={() => setMassage(!massage)} />
            </View>

            {/* Métricas numéricas */}
            <Text className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Métricas del Día</Text>

            <NumericField label="Pasos" emoji="👟" value={steps} onChange={setSteps} placeholder="0" unit="pasos" />
            <NumericField label="Sueño" emoji="😴" value={sleepHours} onChange={setSleepHours} placeholder="7.5" unit="horas" />

            <NumericField label="Agua" emoji="💧" value={waterMl} onChange={setWaterMl} placeholder="0" unit="ml" />
            <View className="flex-row gap-2 mb-4 -mt-2">
              {[250, 500, 750, 1000].map((ml) => (
                <Pressable
                  key={ml}
                  onPress={() => setWaterMl(((parseInt(waterMl) || 0) + ml).toString())}
                  className="flex-1 bg-surface py-2 rounded-xl items-center"
                >
                  <Text className="text-xs text-foreground font-bold" style={{ color: '#FAFAFA' }}>+{ml}ml</Text>
                </Pressable>
              ))}
            </View>

            <NumericField label="Calorías" emoji="🔥" value={calories} onChange={setCalories} placeholder="0" unit="kcal" />
            <NumericField label="Proteína" emoji="🥩" value={protein} onChange={setProtein} placeholder="0" unit="g" />

            <View className="flex-row gap-4 mt-2">
              <Pressable onPress={onClose} className="flex-1 bg-surface rounded-3xl py-5 items-center">
                <Text className="text-foreground font-bold text-lg" style={{ color: '#E4E4E7' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={isLoading}
                className={`flex-1 rounded-3xl py-5 items-center ${isLoading ? 'bg-primary/50' : 'bg-primary'}`}
              >
                {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-background font-black text-lg" style={{ color: '#FAFAFA' }}>GUARDAR</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
