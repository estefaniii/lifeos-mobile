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
import { Titulo, TINTA } from '@/components/decor';

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

  // La paleta oscura cálida de toda la app; el ámbar de Inicio como acento
  const C = {
    bg: TINTA.fondo,
    card: TINTA.tarjeta,
    border: TINTA.borde,
    text: TINTA.texto,
    muted: TINTA.suave,
    accent: '#FFB547',
    onAccent: TINTA.fondo,
  };

  const inp = {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    paddingHorizontal: 18,
    minHeight: 54,
    color: C.text,
    fontSize: 16,
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
            style={{ width: 80, height: 80, borderRadius: 24, marginBottom: 18 }}
          />
          <Titulo size={36} style={{ textAlign: 'center' }}>LifeOS</Titulo>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: C.muted,
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 32,
              maxWidth: 320,
            }}
          >
            Tu ejercicio, tu comida, tus hobbies y tu dinero, en un solo lugar.
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
                  backgroundColor: C.text,
                  borderRadius: 27,
                  minHeight: 54,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <Text style={{ color: C.onAccent, fontSize: 18, fontWeight: '800' }}>G</Text>
                <Text style={{ color: C.onAccent, fontSize: 16, fontWeight: '700' }}>
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
                <Text style={{ color: C.muted, fontSize: 13, marginHorizontal: 12 }}>
                  o con correo
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              </View>
            </>
          )}

          {mode === 'forgot' && (
            <View style={{ marginBottom: 20, alignItems: 'center', width: '100%', maxWidth: 360 }}>
              <Titulo size={24} style={{ marginBottom: 8, textAlign: 'center' }}>Recuperar contraseña</Titulo>
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
              placeholderTextColor={C.muted}
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
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            )}

            {error ? (
              <Text
                style={{
                  color: '#FF7A6B',
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
                borderRadius: 27,
                minHeight: 54,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color={C.onAccent} />
              ) : (
                <Text style={{ color: C.onAccent, fontSize: 16, fontWeight: '800' }}>
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
                style={{ alignItems: 'center', justifyContent: 'center', minHeight: 44 }}
              >
                <Text style={{ color: C.muted, fontSize: 14 }}>
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
              style={{ alignItems: 'center', justifyContent: 'center', minHeight: 44 }}
            >
              <Text style={{ color: C.muted, fontSize: 14 }}>
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
