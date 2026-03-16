import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Platform, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { LineChart } from '@/components/charts';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AddMindModal } from '@/components/modals/add-mind-modal';
import { useColors } from '@/hooks/use-colors';
import {
  useDailyAffirmation,
  useStressTrend,
  useTodayMindWellness,
  useAffirmationHistory,
  useDeleteAffirmation,
} from '@/hooks/use-mind-wellness';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

/**
 * Mind & Assumption Screen
 * 
 * Displays mental wellness and assumption law data with:
 * - Daily affirmation (powered by Neville Goddard's Assumption Law)
 * - Stress level trend (7 days)
 * - Meditation tracking
 * - Journal entries
 * - Affirmation history
 */
export default function MindScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAffirmationModal, setShowAffirmationModal] = useState(false);
  const [showStressModal, setShowStressModal] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data
  const { data: dailyAffirmation, isLoading: affirmationLoading } = useDailyAffirmation();
  const { data: stressTrend, isLoading: stressLoading } = useStressTrend(7);
  const { data: todayWellness, isLoading: wellnessLoading } = useTodayMindWellness();
  const { data: affirmationHistory, isLoading: historyLoading } = useAffirmationHistory(10);
  const deleteAffirmation = useDeleteAffirmation();

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['daily-affirmation'] }),
        queryClient.invalidateQueries({ queryKey: ['stress-trend'] }),
        queryClient.invalidateQueries({ queryKey: ['today-mind-wellness'] }),
        queryClient.invalidateQueries({ queryKey: ['affirmation-history'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateAffirmation = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      // Logic for AI generation or picking a curated one
      // For now, let's simulate a curated selection or "Magic" generation
      const affirmations = [
        "Soy uno con mi deseo, y mi deseo es uno conmigo.",
        "Mi mundo externo es un reflejo de mi estado interno.",
        "Yo soy el arquitecto de mi realidad a través de mi asunción.",
        "La abundancia fluye hacia mí de maneras esperadas e inesperadas.",
        "Camino en el sentimiento de mi deseo cumplido siempre.",
        "Cualquier cosa que asuma como verdadera, se manifestará en mi mundo."
      ];
      
      const randomAff = affirmations[Math.floor(Math.random() * affirmations.length)];
      
      const { error } = await supabase.from('affirmations').insert([
        {
          user_id: user.id,
          text: randomAff,
          date: new Date().toISOString().split('T')[0],
          is_active: true
        }
      ]);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['daily-affirmation'] });
      await queryClient.invalidateQueries({ queryKey: ['affirmation-history'] });
      
      Alert.alert("✨ Nueva Inspiración", "Se ha manifestado una nueva afirmación para ti.");
    } catch (error) {
      console.error("Error generating affirmation:", error);
      Alert.alert("Error", "No se pudo generar la afirmación.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderWellnessCard = (title: string, value: string | number, emoji: string, onPress: () => void, color: string) => (
    <Pressable 
      onPress={onPress} 
      className="glass-card flex-1 rounded-[32px] p-6 shadow-xl border border-white/10 active:scale-95 transition-transform"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="w-12 h-12 rounded-2xl items-center justify-center shadow-lg" style={{ backgroundColor: `${color}15` }}>
          <Text className="text-2xl">{emoji}</Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color={colors.muted} />
      </View>
      <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-1" style={{ color: '#A1A1AA' }}>{title}</Text>
      <Text className="text-3xl font-black text-foreground" style={{ color: '#FAFAFA' }}>{value}</Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View className="px-8 pt-10 pb-6">
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-4xl font-black text-foreground tracking-tight" style={{ color: '#FAFAFA' }}>Mente</Text>
              <Text className="text-lg text-primary font-medium">Asunción Lograda</Text>
            </View>
            <Pressable
              onPress={() => setShowAffirmationModal(true)}
              className="w-14 h-14 rounded-[22px] bg-primary items-center justify-center shadow-2xl shadow-primary/40 active:scale-90"
            >
              <IconSymbol name="plus" size={28} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Hero Daily Affirmation */}
        <View className="px-6 mb-10">
          {!affirmationLoading && dailyAffirmation ? (
            <View className="bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-[40px] p-10 shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
              <View className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
              <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-2xl" />
              
              <Text className="text-xs font-black text-white/80 tracking-[5px] mb-6 uppercase">
                Inspiración de Hoy
              </Text>
              
              <Text className="text-3xl font-bold text-white leading-tight mb-8">
                "{dailyAffirmation.text}"
              </Text>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-[2px] bg-white/40" />
                  <Text className="text-xs text-white/70 font-bold uppercase tracking-widest">
                    Neville Goddard
                  </Text>
                </View>
                <Pressable 
                  onPress={handleGenerateAffirmation}
                  disabled={isGenerating}
                  className="bg-white/10 px-4 py-2 rounded-full border border-white/20 active:bg-white/20"
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white text-[10px] font-black uppercase tracking-wider">Expandir ✨</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : affirmationLoading ? (
            <View className="h-48 bg-surface rounded-[40px] items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <Pressable 
              onPress={handleGenerateAffirmation}
              className="bg-surface/50 border-2 border-dashed border-primary/20 rounded-[40px] p-12 items-center justify-center"
            >
              <Text className="text-primary text-4xl mb-4">✨</Text>
              <Text className="text-foreground font-bold text-lg mb-2" style={{ color: '#FAFAFA' }}>Manifestar Afirmación</Text>
              <Text className="text-muted text-center px-6" style={{ color: '#A1A1AA' }}>Toca para recibir la guía de hoy según tu estado deseado</Text>
            </Pressable>
          )}
        </View>

        {/* Wellness Stats Grid */}
        <View className="px-6 mb-10">
          <View className="flex-row gap-4 mb-4">
            {renderWellnessCard("Paz", `${todayWellness?.stressLevel || 0}/10`, "😌", () => setShowStressModal(true), colors.error)}
            {renderWellnessCard("Presencia", `${todayWellness?.meditationMinutes || 0}m`, "🧘", () => setShowMeditationModal(true), colors.primary)}
          </View>
          <View className="flex-row">
            {renderWellnessCard("Diario", `${todayWellness?.journalEntries || 0} Entradas`, "✍️", () => setShowJournalModal(true), colors.accent)}
          </View>
        </View>

        {/* Charts Section */}
        {stressTrend && stressTrend.length > 0 && (
          <View className="px-6 mb-10">
            <View className="bg-surface/30 rounded-[40px] p-6 border border-white/5">
              <LineChart
                data={stressTrend}
                title="Fluctuación de Paz Interior"
                yLabel="Nivel"
                color={colors.error}
              />
            </View>
          </View>
        )}

        {/* Affirmation History */}
        <View className="px-8 mb-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Bitácora de Asunción</Text>
            <Pressable>
              <Text className="text-sm font-bold text-primary">Ver Historial</Text>
            </Pressable>
          </View>

          {affirmationHistory && affirmationHistory.length > 0 ? (
            affirmationHistory.map((affirmation: any, index) => (
              <View key={affirmation.id || index} className="bg-surface/50 rounded-3xl p-6 mb-4 flex-row justify-between items-center border border-white/5 shadow-sm">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-medium text-foreground mb-2 leading-relaxed italic" style={{ color: '#FAFAFA' }}>
                    "{affirmation.text}"
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <IconSymbol name="calendar" size={12} color={colors.muted} />
                    <Text className="text-[10px] text-muted font-bold uppercase tracking-widest" style={{ color: '#A1A1AA' }}>
                      {new Date(affirmation.date).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      if (window.confirm("¿Deseas soltar esta afirmación?")) {
                        deleteAffirmation.mutate(affirmation.id);
                      }
                    } else {
                      Alert.alert(
                        "Soltar Afirmación",
                        "¿Estás seguro de eliminar este registro de tu historia?",
                        [
                          { text: "Mantener", style: "cancel" },
                          { text: "Soltar", style: "destructive", onPress: () => deleteAffirmation.mutate(affirmation.id) }
                        ]
                      );
                    }
                  }}
                  className="w-10 h-10 bg-error/10 rounded-2xl items-center justify-center active:bg-error/20"
                >
                  <IconSymbol name="trash.fill" size={16} color={colors.error} />
                </Pressable>
              </View>
            ))
          ) : (
            <View className="bg-surface/30 rounded-[32px] p-10 items-center border border-dashed border-white/10">
              <IconSymbol name="doc.text.fill" size={32} color={colors.muted} />
              <Text className="text-muted font-bold mt-4 uppercase tracking-widest text-xs" style={{ color: '#A1A1AA' }}>Aún no hay registros</Text>
            </View>
          )}
        </View>

        {/* Law Quote */}
        <View className="mx-6 glass-card bg-indigo-500/5 border-indigo-500/20 rounded-[40px] p-8 mb-10">
          <Text className="text-2xl mb-4">💡</Text>
          <Text className="text-sm text-foreground/90 font-medium leading-relaxed italic" style={{ color: 'rgba(250,250,250,0.9)' }}>
            "Si persistes en la asunción de que ya eres lo que deseas ser, esa asunción, aunque sea falsa para los sentidos, si eres persistente, se endurecerá en un hecho."
          </Text>
          <Text className="text-[10px] text-primary font-black mt-4 uppercase tracking-widest">— Neville Goddard</Text>
        </View>

        {/* Modals */}
        {user && (
          <>
            <AddMindModal
              visible={showAffirmationModal}
              onClose={() => setShowAffirmationModal(false)}
              userId={String(user.id)}
              type="affirmation"
            />
            <AddMindModal
              visible={showStressModal}
              onClose={() => setShowStressModal(false)}
              userId={String(user.id)}
              type="stress"
            />
            <AddMindModal
              visible={showMeditationModal}
              onClose={() => setShowMeditationModal(false)}
              userId={String(user.id)}
              type="meditation"
            />
            <AddMindModal
              visible={showJournalModal}
              onClose={() => setShowJournalModal(false)}
              userId={String(user.id)}
              type="journal"
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

