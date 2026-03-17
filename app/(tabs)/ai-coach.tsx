import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { useAICoach } from '@/hooks/use-ai-coach';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AICoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { processMessage, loading: isTyping } = useAICoach();
  const genderEmoji = (user as any)?.gender === 'masculino' ? '👑' : (user as any)?.gender === 'otro' ? '✨' : '👸';
  const genderTitle = (user as any)?.gender === 'masculino' ? 'rey' : (user as any)?.gender === 'otro' ? '' : 'reina';

  const welcomeMsg: Message = {
    id: 'welcome',
    text: `¡Hola ${user?.name || genderTitle || 'tú'}! ${genderEmoji} Soy tu LifeOS Coach. Cuéntame sobre tus finanzas, salud o progreso mental. Guardaré todo lo importante por ti.`,
    sender: 'ai',
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Load chat history from Supabase
  useEffect(() => {
    if (!user?.id) { setLoadingHistory(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('chat_messages')
          .select('id, text, sender, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (data && data.length > 0) {
          const loaded: Message[] = data.map((m: any) => ({
            id: m.id,
            text: m.text,
            sender: m.sender,
            timestamp: new Date(m.created_at),
          }));
          setMessages(loaded);
        }
      } catch (err) {
        console.warn('[AI Coach] Could not load history:', err);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [user?.id]);

  // Handle keyboard on mobile web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const vv = (window as any).visualViewport;
    if (!vv) return;
    const onResize = () => {
      const isOpen = vv.height < window.innerHeight * 0.85;
      setKeyboardOpen(isOpen);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // Save message to Supabase
  const saveMessage = useCallback(async (text: string, sender: 'user' | 'ai') => {
    if (!user?.id) return;
    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        text,
        sender,
      });
    } catch (err) {
      console.warn('[AI Coach] Could not save message:', err);
    }
  }, [user?.id]);

  const clearChat = useCallback(async () => {
    // Delete from DB
    if (user?.id) {
      try {
        await supabase.from('chat_messages').delete().eq('user_id', user.id);
      } catch {}
    }
    const newWelcome: Message = {
      id: Date.now().toString(),
      text: `Nueva sesión iniciada. ¿En qué te enfocas hoy, ${user?.name || genderTitle || 'tú'}? ${genderEmoji}`,
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([newWelcome]);
    saveMessage(newWelcome.text, 'ai');
  }, [user, genderTitle, genderEmoji, saveMessage]);

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userText = inputText;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    saveMessage(userText, 'user');

    const result = await processMessage(userText);

    const aiText = result && result.success
      ? (result.actionSummary
        ? `${result.actionSummary}\n\n${result.aiResponse ?? ''}`
        : (result.aiResponse ?? ''))
      : 'Lo siento, tuve un problema procesando eso. Inténtalo de nuevo, ¡tú puedes! 💪';

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: aiText,
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
    saveMessage(aiText, 'ai');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#09090B' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 49 : 0}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#27272A',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#FAFAFA' }}>AI Coach</Text>
            <Text style={{ fontSize: 9, color: '#71717A', marginTop: 2, letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase' }}>
              Tu asistente personal
            </Text>
          </View>
          <Pressable
            onPress={clearChat}
            style={{
              backgroundColor: 'rgba(113,113,122,0.15)',
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: '#27272A',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#71717A', textTransform: 'uppercase' }}>
              Limpiar
            </Text>
          </Pressable>
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12, paddingBottom: 8, maxWidth: 600, alignSelf: 'center', width: '100%' }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {loadingHistory ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={{ color: '#71717A', fontSize: 12, marginTop: 8 }}>Cargando historial...</Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={{
                  maxWidth: '82%',
                  marginBottom: 10,
                  padding: 12,
                  borderRadius: 16,
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? colors.primary : '#27272A',
                  borderTopRightRadius: msg.sender === 'user' ? 4 : 16,
                  borderTopLeftRadius: msg.sender === 'user' ? 16 : 4,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  color: '#FAFAFA',
                  lineHeight: 20,
                }}>
                  {msg.text}
                </Text>
                <Text style={{
                  fontSize: 9,
                  marginTop: 4,
                  opacity: 0.5,
                  color: '#A1A1AA',
                  textAlign: 'right',
                }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          )}
          {isTyping && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8, marginBottom: 12 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: 1 }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: 0.6 }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: 0.3 }} />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={{
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 60 : Platform.OS === 'web' ? (keyboardOpen ? 10 : 80) : 12,
          backgroundColor: '#18181B',
          borderTopWidth: 1,
          borderTopColor: '#27272A',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            backgroundColor: '#27272A',
            borderWidth: 1,
            borderColor: '#3F3F46',
            borderRadius: 24,
            paddingHorizontal: 6,
            paddingVertical: 4,
            maxWidth: 600,
            alignSelf: 'center',
            width: '100%',
          }}>
            <TextInput
              style={{
                flex: 1,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: '#FAFAFA',
                fontSize: 14,
                maxHeight: 100,
              }}
              placeholder={`Háblame, ${user?.name || genderTitle || 'tú'}...`}
              placeholderTextColor="#52525B"
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={sendMessage}
            />
            <Pressable
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                marginBottom: 2,
                backgroundColor: !inputText.trim() || isTyping ? '#3F3F46' : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !inputText.trim() || isTyping ? 0.6 : 1,
              }}
            >
              <IconSymbol
                name="paperplane.fill"
                size={16}
                color={!inputText.trim() || isTyping ? '#71717A' : colors.background}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
