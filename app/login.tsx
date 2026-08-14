import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const siteUrl =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : 'https://lifeos-mobilee.vercel.app';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: siteUrl + '/oauth/callback',
        },
      });
      if (res.error) throw res.error;
    } catch (err) {
      const e = err as any;
      setError(e?.message || 'Error al iniciar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: siteUrl + '/oauth/callback',
        });
        if (res.error) throw res.error;
        setSuccess('Revisa tu correo para restablecer tu contraseña.');
      } catch (err) {
        const e = err as any;
        setError(e?.message || 'Error al enviar el correo');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim()) {
      setError('Ingresa tu contraseña');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'register') {
        const res = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: siteUrl + '/oauth/callback',
          },
        });
        if (res.error) throw res.error;
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmarla.');
      } else {
        const res = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (res.error) throw res.error;
      }
    } catch (err) {
      const e = err as any;
      const msg: string = e?.message || 'Error de autenticación';
      if (msg.includes('Invalid login credentials') || msg.includes('Invalid login')) {
        setError('Correo o contraseña incorrectos');
      } else if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('Este correo ya está registrado. Inicia sesión.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirma tu correo electrónico primero.');
      } else if (msg.includes('Load failed') || msg.includes('Failed to fetch')) {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  const C = {
    bg: '#09090B',
    card: '#18181B',
    border: '#27272A',
    text: '#FAFAFA',
    muted: '#71717A',
    dim: '#52525B',
    accent: '#14B8A6',
  };

  const inp = {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: C.text,
    fontSize: 15,
  } as any;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 88, height: 88, borderRadius: 22, marginBottom: 16 }}
          />
          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: C.text,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            LifeOS
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: C.muted,
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            Tu centro de control personal con IA
          </Text>

          {mode !== 'forgot' && (
            <>
              <Pressable
                onPress={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: '#FAFAFA',
                  borderRadius: 10,
                  paddingVertical: 13,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700' }}>G</Text>
                <Text style={{ color: '#18181B', fontSize: 15, fontWeight: '700' }}>
                  Continuar con Google
                </Text>
              </Pressable>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 360,
                  marginVertical: 20,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
                <Text style={{ color: C.dim, fontSize: 13, marginHorizontal: 12 }}>
                  o con correo
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              </View>
            </>
          )}

          {mode === 'forgot' && (
            <View style={{ marginBottom: 20, alignItems: 'center', width: '100%', maxWidth: 360 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: C.text,
                  marginBottom: 8,
                }}
              >
                Recuperar contraseña
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: C.muted,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Te enviaremos un enlace para restablecer tu contraseña.
              </Text>
            </View>
          )}

          <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
            <TextInput
              style={inp}
              placeholder="Correo electrónico"
              placeholderTextColor={C.dim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {mode !== 'forgot' && (
              <TextInput
                style={inp}
                placeholder="Contraseña"
                placeholderTextColor={C.dim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            )}

            {error ? (
              <Text
                style={{
                  color: '#ef4444',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {error}
              </Text>
            ) : null}

            {success ? (
              <Text
                style={{
                  color: C.accent,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {success}
              </Text>
            ) : null}

            <Pressable
              onPress={handleEmailAuth}
              disabled={loading}
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: loading ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                  {mode === 'register'
                    ? 'Crear cuenta'
                    : mode === 'forgot'
                    ? 'Enviar enlace'
                    : 'Iniciar sesión'}
                </Text>
              )}
            </Pressable>

            {mode === 'login' && (
              <Pressable
                onPress={() => switchMode('forgot')}
                style={{ alignItems: 'center', marginTop: 4 }}
              >
                <Text style={{ color: C.muted, fontSize: 13 }}>
                  ¿Olvidaste tu contraseña?{' '}
                  <Text style={{ color: C.accent, fontWeight: '600' }}>Recupérala</Text>
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() =>
                switchMode(
                  mode === 'register' ? 'login' : mode === 'forgot' ? 'login' : 'register'
                )
              }
              style={{ marginTop: 8, alignItems: 'center' }}
            >
              <Text style={{ color: C.muted, fontSize: 13 }}>
                {mode === 'forgot'
                  ? '← Volver al inicio de sesión'
                  : mode === 'register'
                  ? '¿Ya tienes cuenta? '
                  : '¿No tienes cuenta? '}
                {mode !== 'forgot' && (
                  <Text style={{ color: C.accent, fontWeight: '600' }}>
                    {mode === 'register' ? 'Inicia sesión' : 'Regístrate'}
                  </Text>
                )}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
