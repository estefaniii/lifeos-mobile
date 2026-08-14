import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

const COLORS = {
  bg: '#09090B',
  card: '#0F0F12',
  surface: '#18181B',
  border: '#27272A',
  borderFocus: '#14B8A6',
  text: '#FAFAFA',
  muted: '#A1A1AA',
  subtle: '#52525B',
  primary: '#14B8A6',
  primaryDark: '#0F766E',
  danger: '#EF4444',
  success: '#22C55E',
};

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

function EyeIcon({ open, size = 18 }: { open: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {open ? (
        <>
          <Path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
            stroke={COLORS.muted}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            stroke={COLORS.muted}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <Path
          d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17.9 17.9 0 0 1-3.4 4.4M6.6 6.6A17.8 17.8 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.6-1"
          stroke={COLORS.muted}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

function getRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/oauth/callback`;
  }
  // Native: use the configured deep-link scheme
  return Linking.createURL('/oauth/callback');
}

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const redirectUrl = useMemo(() => getRedirectUrl(), []);

  // If user lands here from a recovery email, switch to "reset" mode.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery')) {
      setMode('reset');
    }
    // Listen to recovery event from supabase too (in case session is set first)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });
    return () => subscription.unsubscribe();
  }, []);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
      // Browser redirects to Google — keep loading state
    } catch (err: any) {
      setError(err?.message || 'No se pudo abrir Google. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setError(null);
    setSuccess(null);

    if (mode === 'reset') {
      if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
      if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess('Contraseña actualizada. Te llevamos a tu panel…');
        setTimeout(() => router.replace('/(tabs)'), 800);
      } catch (err: any) {
        setError(err?.message || 'No se pudo actualizar la contraseña.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!validateEmail(email)) return setError('Ingresa un email válido.');

    if (mode === 'forgot') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        setSuccess('Te enviamos un enlace para restablecer tu contraseña.');
      } catch (err: any) {
        setError(err?.message || 'No se pudo enviar el email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (mode === 'register' && password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Auth provider listener handles navigation
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('invalid login')) setError('Email o contraseña incorrectos.');
      else if (msg.includes('already registered') || msg.includes('user already')) {
        setError('Este email ya está registrado. Inicia sesión.');
      } else if (msg.includes('email not confirmed')) {
        setError('Confirma tu email primero. Revisa tu bandeja de entrada.');
      } else if (msg.includes('rate limit')) {
        setError('Demasiados intentos. Espera unos segundos e intenta de nuevo.');
      } else {
        setError(err?.message || 'Error de autenticación.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  };

  const headerCopy = (() => {
    switch (mode) {
      case 'register':
        return { title: 'Crea tu cuenta', sub: 'Empieza a organizar tu vida con IA.' };
      case 'forgot':
        return { title: 'Recuperar contraseña', sub: 'Te enviaremos un enlace por email.' };
      case 'reset':
        return { title: 'Nueva contraseña', sub: 'Crea una contraseña segura para tu cuenta.' };
      default:
        return { title: 'Bienvenida de vuelta', sub: 'Tu centro de control personal con IA.' };
    }
  })();

  const ctaLabel =
    mode === 'register' ? 'Crear cuenta' :
    mode === 'forgot' ? 'Enviar enlace' :
    mode === 'reset' ? 'Guardar contraseña' :
    'Iniciar sesión';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 24 }}>
            {/* Logo + Header */}
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 22,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                  shadowColor: COLORS.primary,
                  shadowOpacity: 0.25,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 8 },
                }}
              >
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={{ width: 64, height: 64, borderRadius: 16 }}
                />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 }}>
                {headerCopy.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.muted,
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 20,
                }}
              >
                {headerCopy.sub}
              </Text>
            </View>

            {/* Mode tabs (only login/register) */}
            {(mode === 'login' || mode === 'register') && (
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: COLORS.surface,
                  borderRadius: 14,
                  padding: 4,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                {(['login', 'register'] as const).map((m) => {
                  const active = mode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => switchMode(m)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: 'center',
                        borderRadius: 10,
                        backgroundColor: active ? COLORS.primary : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          color: active ? '#fff' : COLORS.muted,
                          fontWeight: '700',
                          fontSize: 13,
                        }}
                      >
                        {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Google button */}
            {(mode === 'login' || mode === 'register') && (
              <>
                <Pressable
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    paddingVertical: 14,
                    opacity: loading ? 0.6 : pressed ? 0.9 : 1,
                  })}
                >
                  <GoogleIcon size={20} />
                  <Text style={{ color: '#1F1F1F', fontSize: 15, fontWeight: '700' }}>
                    Continuar con Google
                  </Text>
                </Pressable>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 20,
                  }}
                >
                  <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                  <Text
                    style={{
                      color: COLORS.subtle,
                      fontSize: 11,
                      marginHorizontal: 14,
                      letterSpacing: 1.4,
                      textTransform: 'uppercase',
                      fontWeight: '600',
                    }}
                  >
                    o con email
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                </View>
              </>
            )}

            {/* Form */}
            <View style={{ gap: 12 }}>
              {mode !== 'reset' && (
                <Field
                  label="Email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <Field
                  label={mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === 'register' ? 'password-new' : 'password'}
                  textContentType={mode === 'register' ? 'newPassword' : 'password'}
                  rightSlot={
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                      <EyeIcon open={showPassword} />
                    </Pressable>
                  }
                />
              )}

              {(mode === 'register' || mode === 'reset') && (
                <Field
                  label="Confirmar contraseña"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
              )}

              {/* Forgot link */}
              {mode === 'login' && (
                <Pressable onPress={() => switchMode('forgot')} style={{ alignSelf: 'flex-end' }}>
                  <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </Pressable>
              )}

              {/* Error / Success */}
              {error && (
                <View
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.10)',
                    borderColor: 'rgba(239,68,68,0.35)',
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>{error}</Text>
                </View>
              )}
              {success && (
                <View
                  style={{
                    backgroundColor: 'rgba(34,197,94,0.10)',
                    borderColor: 'rgba(34,197,94,0.35)',
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: '#86EFAC', fontSize: 13, textAlign: 'center' }}>{success}</Text>
                </View>
              )}

              {/* Submit */}
              <Pressable
                onPress={handleEmailAuth}
                disabled={loading}
                style={({ pressed }) => ({
                  backgroundColor: COLORS.primary,
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: 'center',
                  marginTop: 4,
                  opacity: loading ? 0.6 : pressed ? 0.9 : 1,
                  shadowColor: COLORS.primary,
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                })}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 }}>
                    {ctaLabel}
                  </Text>
                )}
              </Pressable>

              {/* Back to login from forgot/reset */}
              {(mode === 'forgot' || mode === 'reset') && (
                <Pressable onPress={() => switchMode('login')} style={{ alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                    Volver al{' '}
                    <Text style={{ color: COLORS.primary, fontWeight: '700' }}>inicio de sesión</Text>
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Legal */}
            {mode === 'register' && (
              <Text
                style={{
                  textAlign: 'center',
                  color: COLORS.subtle,
                  fontSize: 11,
                  marginTop: 18,
                  lineHeight: 16,
                }}
              >
                Al crear una cuenta aceptas los Términos y la Política de Privacidad de LifeOS.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Field component
// ---------------------------------------------------------------------------

function Field({
  label,
  rightSlot,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 6,
          marginLeft: 2,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: focused ? COLORS.borderFocus : COLORS.border,
          borderRadius: 14,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={COLORS.subtle}
          style={[
            {
              flex: 1,
              color: COLORS.text,
              fontSize: 15,
              paddingVertical: 14,
            },
            // Avoid the default outline on web
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
          ]}
        />
        {rightSlot ? <View style={{ marginLeft: 8 }}>{rightSlot}</View> : null}
      </View>
    </View>
  );
}
