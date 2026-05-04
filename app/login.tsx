import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginScreen() {
  const [mode, setMode] = useState('login' as Mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [success, setSuccess] = useState(null as string | null);

  const siteUrl = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://lifeos-mobile.vercel.app';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: siteUrl + '/oauth/callback' },
      });
      if (res.error) throw res.error;
    } catch (err) {
      const e = err as any;
      setError(e.message || 'Error al iniciar con Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim()) { setError('Ingresa tu email'); return; }
    if (mode === 'forgot') {
      setLoading(true); setError(null); setSuccess(null);
      try {
        const res = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: siteUrl });
        if (res.error) throw res.error;
        setSuccess('Revisa tu email para restablecer tu contrasena.');
      } catch (err) {
        const e = err as any;
        setError(e.message || 'Error al enviar email');
      } finally { setLoading(false); }
      return;
    }
    if (!password.trim()) { setError('Ingresa tu contrasena'); return; }
    if (password.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === 'register') {
        const res = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: siteUrl } });
        if (res.error) throw res.error;
        setSuccess('Cuenta creada! Revisa tu email para confirmar.');
      } else {
        const res = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (res.error) throw res.error;
      }
    } catch (err) {
      const e = err as any;
      const msg = e.message || 'Error de autenticacion';
      if (msg.includes('Invalid login')) setError('Email o contrasena incorrectos');
      else if (msg.includes('already registered')) setError('Email ya registrado. Inicia sesion.');
      else if (msg.includes('Email not confirmed')) setError('Confirma tu email primero.');
      else setError(msg);
    } finally { setLoading(false); }
  };

  const switchMode = (m: Mode) => { setMode(m); setError(null); setSuccess(null); };

  const styles = {
    bg: '#09090B', card: '#18181B', border: '#27272A',
    text: '#FAFAFA', muted: '#71717A', dim: '#52525B', accent: '#14B8A6',
  };

  const inp = { backgroundColor: styles.card, borderWidth: 1, borderColor: styles.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: styles.text, fontSize: 15 } as any;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: styles.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Image source={require('@/assets/images/icon.png')} style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 24 }} />
          <Text style={{ fontSize: 28, fontWeight: '800', color: styles.text, textAlign: 'center', marginBottom: 4 }}>LifeOS</Text>
          <Text style={{ fontSize: 14, color: styles.muted, textAlign: 'center', marginBottom: 40 }}>Tu centro de control personal con IA</Text>
          {mode !== 'forgot' && (
            <Pressable onPress={handleGoogleLogin} disabled={loading} style={{ width: '100%', maxWidth: 360, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FAFAFA', borderRadius: 16, paddingVertical: 14, opacity: loading ? 0.6 : 1 }}>
              <Text style={{ fontSize: 20 }}>G</Text>
              <Text style={{ color: '#18181B', fontSize: 15, fontWeight: '700' }}>Continuar con Google</Text>
            </Pressable>
          )}
          {mode !== 'forgot' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 360, marginVertical: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: styles.border }} />
              <Text style={{ color: styles.dim, fontSize: 12, marginHorizontal: 16 }}>o con email</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: styles.border }} />
            </View>
          )}
          {mode === 'forgot' && (
            <View style={{ marginBottom: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: styles.text, marginBottom: 8 }}>Recuperar contrasena</Text>
              <Text style={{ fontSize: 13, color: styles.muted, textAlign: 'center', lineHeight: 18 }}>Te enviaremos un enlace para restablecer tu contrasena.</Text>
            </View>
          )}
          <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
            <TextInput style={inp} placeholder="Email" placeholderTextColor={styles.dim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            {mode !== 'forgot' && (
              <TextInput style={inp} placeholder="Contrasena" placeholderTextColor={styles.dim} value={password} onChangeText={setPassword} secureTextEntry />
            )}
            {error ? <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</Text> : null}
            {success ? <Text style={{ color: styles.accent, fontSize: 13, textAlign: 'center' }}>{success}</Text> : null}
            <Pressable onPress={handleEmailAuth} disabled={loading} style={{ backgroundColor: styles.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{mode === 'register' ? 'Crear cuenta' : mode === 'forgot' ? 'Enviar enlace' : 'Iniciar sesion'}</Text>}
            </Pressable>
            {mode === 'login' && (
              <Pressable onPress={() => switchMode('forgot')} style={{ alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: styles.muted, fontSize: 12 }}>Olvidaste tu contrasena? <Text style={{ color: styles.accent, fontWeight: '600' }}>Recuperala</Text></Text>
              </Pressable>
            )}
          </View>
          <Pressable onPress={() => switchMode(mode === 'register' ? 'login' : mode === 'forgot' ? 'login' : 'register')} style={{ marginTop: 20 }}>
            <Text style={{ color: styles.muted, fontSize: 13 }}>
              {mode === 'forgot' ? '' : mode === 'register' ? 'Ya tienes cuenta? ' : 'No tienes cuenta? '}
              <Text style={{ color: styles.accent, fontWeight: '600' }}>{mode === 'forgot' ? 'Volver al inicio de sesion' : mode === 'register' ? 'Inicia sesion' : 'Registrate'}</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}