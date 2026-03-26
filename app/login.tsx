import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
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

  const siteUrl = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://lifeos-mobilee.vercel.app';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: siteUrl,
        },
      });
      if (error) throw error;
      // Browser will redirect to Google — don't reset loading
    } catch (err: any) {
      setError(err.message || 'Error al iniciar con Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim()) {
      setError('Ingresa tu email');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: siteUrl,
        });
        if (error) throw error;
        setSuccess('Revisa tu email para restablecer tu contraseña.');
      } catch (err: any) {
        setError(err.message || 'Error al enviar email');
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
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: siteUrl,
          },
        });
        if (error) throw error;
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Auth state listener in provider handles navigation
      }
    } catch (err: any) {
      const msg = err.message || 'Error de autenticación';
      if (msg.includes('Invalid login')) {
        setError('Email o contraseña incorrectos');
      } else if (msg.includes('already registered')) {
        setError('Este email ya está registrado. Inicia sesión.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirma tu email primero. Revisa tu bandeja de entrada.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090B' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          {/* Logo */}
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 24 }}
          />
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FAFAFA', textAlign: 'center', marginBottom: 4 }}>
            LifeOS
          </Text>
          <Text style={{ fontSize: 14, color: '#71717A', textAlign: 'center', marginBottom: 40 }}>
            Tu centro de control personal con IA
          </Text>

          {/* Google Button */}
          {mode !== 'forgot' && (
            <Pressable
              onPress={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                maxWidth: 360,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                backgroundColor: '#FAFAFA',
                borderRadius: 16,
                paddingVertical: 14,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 20 }}>G</Text>
              <Text style={{ color: '#18181B', fontSize: 15, fontWeight: '700' }}>
                Continuar con Google
              </Text>
            </Pressable>
          )}

          {/* Divider */}
          {mode !== 'forgot' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 360, marginVertical: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#27272A' }} />
              <Text style={{ color: '#52525B', fontSize: 12, marginHorizontal: 16 }}>o con email</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#27272A' }} />
            </View>
          )}

          {/* Forgot password header */}
          {mode === 'forgot' && (
            <View style={{ marginBottom: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FAFAFA', marginBottom: 8 }}>
                Recuperar contraseña
              </Text>
              <Text style={{ fontSize: 13, color: '#71717A', textAlign: 'center', lineHeight: 18 }}>
                Te enviaremos un email con un enlace{'\n'}para restablecer tu contraseña.
              </Text>
            </View>
          )}

          {/* Email/Password */}
          <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
            <TextInput
              style={{
                backgroundColor: '#18181B',
                borderWidth: 1,
                borderColor: '#27272A',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: '#FAFAFA',
                fontSize: 15,
              }}
              placeholder="Email"
              placeholderTextColor="#52525B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {mode !== 'forgot' && (
              <TextInput
                style={{
                  backgroundColor: '#18181B',
                  borderWidth: 1,
                  borderColor: '#27272A',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#FAFAFA',
                  fontSize: 15,
                }}
                placeholder="Contraseña"
                placeholderTextColor="#52525B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            )}

            {error && (
              <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</Text>
            )}
            {success && (
              <Text style={{ color: '#14B8A6', fontSize: 13, textAlign: 'center' }}>{success}</Text>
            )}

            <Pressable
              onPress={handleEmailAuth}
              disabled={loading}
              style={{
                backgroundColor: '#14B8A6',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                  {mode === 'register' ? 'Crear cuenta' : mode === 'forgot' ? 'Enviar enlace' : 'Iniciar sesión'}
                </Text>
              )}
            </Pressable>

            {/* Forgot password link */}
            {mode === 'login' && (
              <Pressable onPress={() => switchMode('forgot')} style={{ alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: '#71717A', fontSize: 12 }}>
                  ¿Olvidaste tu contraseña?{' '}
                  <Text style={{ color: '#14B8A6', fontWeight: '600' }}>Recupérala</Text>
                </Text>
              </Pressable>
            )}
          </View>

          {/* Toggle mode */}
          <Pressable
            onPress={() => switchMode(mode === 'register' ? 'login' : mode === 'forgot' ? 'login' : 'register')}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: '#71717A', fontSize: 13 }}>
              {mode === 'forgot' ? '' : mode === 'register' ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <Text style={{ color: '#14B8A6', fontWeight: '600' }}>
                {mode === 'forgot' ? 'Volver al inicio de sesión' : mode === 'register' ? 'Inicia sesión' : 'Regístrate'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
