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
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register' | 'forgot' | 'new-password';

// SVG Google icon rendered as Text fallback (works on web and native)
const GoogleIcon = () => (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#4285F4', lineHeight: 20 }}>G</Text>Text>
    </View>View>
  );

export default function LoginScreen() {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

  // Dynamic URL — no hardcoded typo
  const siteUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
          : 'https://lifeos-mobile.vercel.app';

  // ---- Google OAuth ----
  const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
                const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                                      redirectTo: `${siteUrl}/oauth/callback`,
                                      queryParams: { access_type: 'offline', prompt: 'consent' },
                          },
                });
                if (error) throw error;
                // Browser redirects to Google — keep loading state
        } catch (err: any) {
                setError(err.message || 'Error al iniciar con Google');
                setLoading(false);
        }
  };

  // ---- New password after recovery link ----
  const handleNewPassword = async () => {
        if (!newPassword.trim()) { setError('Ingresa la nueva contraseña'); return; }
        if (newPassword.length < 6) { setError('Mínimo 6 caracteres'); return; }
        setLoading(true);
        setError(null);
        try {
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;
                setSuccess('¡Contraseña actualizada! Ya puedes iniciar sesión.');
                setTimeout(() => switchMode('login'), 2000);
        } catch (err: any) {
                setError(err.message || 'Error al actualizar contraseña');
        } finally {
                setLoading(false);
        }
  };

  // ---- Email / password auth ----
  const handleEmailAuth = async () => {
        if (!email.trim()) { setError('Ingresa tu email'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) { setError('Email no válido'); return; }

        if (mode === 'forgot') {
                setLoading(true);
                setError(null);
                setSuccess(null);
                try {
                          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                                      redirectTo: `${siteUrl}/oauth/callback?type=recovery`,
                          });
                          if (error) throw error;
                          setSuccess('Revisa tu email. Te enviamos el enlace de recuperación.');
                } catch (err: any) {
                          setError(err.message || 'Error al enviar email');
                } finally {
                          setLoading(false);
                }
                return;
        }

        if (!password.trim()) { setError('Ingresa tu contraseña'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }

        if (mode === 'register') {
                if (!confirmPassword.trim()) { setError('Confirma tu contraseña'); return; }
                if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
                if (mode === 'register') {
                          const { error } = await supabase.auth.signUp({
                                      email: email.trim(),
                                      password,
                                      options: { emailRedirectTo: siteUrl },
                          });
                          if (error) throw error;
                          setSuccess('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
                } else {
                          const { error } = await supabase.auth.signInWithPassword({
                                      email: email.trim(),
                                      password,
                          });
                          if (error) throw error;
                          // Auth provider listener handles navigation
                }
        } catch (err: any) {
                const msg = err.message || 'Error de autenticación';
                if (msg.includes('Invalid login')) {
                          setError('Email o contraseña incorrectos');
                } else if (msg.includes('already registered')) {
                          setError('Este email ya está registrado. Intenta iniciar sesión.');
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
        setPassword('');
        setConfirmPassword('');
        setNewPassword('');
  };

  // ---- Styles ----
  const inputStyle = {
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#FAFAFA',
        fontSize: 15,
        flex: 1,
  } as const;

  const inputWrapStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 14,
        overflow: 'hidden' as const,
  };

  return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#09090B' }}>
                <KeyboardAvoidingView
                          style={{ flex: 1 }}
                          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        >
                        <ScrollView
                                    contentContainerStyle={{
                                                  flexGrow: 1,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  paddingHorizontal: 28,
                                                  paddingVertical: 40,
                                    }}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                  >
                          {/* Logo + Title */}
                                  <Image
                                                source={require('@/assets/images/icon.png')}
                                                style={{ width: 88, height: 88, borderRadius: 22, marginBottom: 20 }}
                                              />
                                  <Text style={{ fontSize: 30, fontWeight: '800', color: '#FAFAFA', textAlign: 'center', marginBottom: 6 }}>
                                              LifeOS
                                  </Text>Text>
                                  <Text style={{ fontSize: 14, color: '#71717A', textAlign: 'center', marginBottom: 36, lineHeight: 20 }}>
                                              Tu centro de control personal con IA
                                  </Text>Text>
                        
                          {/* ---- NEW PASSWORD MODE ---- */}
                          {mode === 'new-password' && (
                                                <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
                                                              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FAFAFA', textAlign: 'center', marginBottom: 4 }}>
                                                                              Nueva contraseña
                                                              </Text>Text>
                                                              <Text style={{ fontSize: 13, color: '#71717A', textAlign: 'center', marginBottom: 12 }}>
                                                                              Elige una contraseña nueva y segura.
                                                              </Text>Text>
                                                              <View style={inputWrapStyle}>
                                                                              <TextInput
                                                                                                  style={{ ...inputStyle }}
                                                                                                  placeholder="Nueva contraseña"
                                                                                                  placeholderTextColor="#52525B"
                                                                                                  value={newPassword}
                                                                                                  onChangeText={setNewPassword}
                                                                                                  secureTextEntry={!showNew}
                                                                                                />
                                                                              <Pressable onPress={() => setShowNew(v => !v)} style={{ paddingHorizontal: 14 }}>
                                                                                                <Text style={{ color: '#52525B', fontSize: 13 }}>{showNew ? 'Ocultar' : 'Ver'}</Text>Text>
                                                                              </Pressable>Pressable>
                                                              </View>View>
                                                  {error && (
                                                                  <View style={{ backgroundColor: '#450a0a', borderRadius: 10, padding: 10 }}>
                                                                                    <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{error}</Text>Text>
                                                                  </View>View>
                                                              )}
                                                  {success && (
                                                                  <View style={{ backgroundColor: '#042f2e', borderRadius: 10, padding: 10 }}>
                                                                                    <Text style={{ color: '#5eead4', fontSize: 13, textAlign: 'center' }}>{success}</Text>Text>
                                                                  </View>View>
                                                              )}
                                                              <Pressable
                                                                                onPress={handleNewPassword}
                                                                                disabled={loading}
                                                                                style={{ backgroundColor: '#14B8A6', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
                                                                              >
                                                                {loading ? <ActivityIndicator color="#fff" /> : (
                                                                                                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Guardar contraseña</Text>Text>
                                                                              )}
                                                              </Pressable>Pressable>
                                                </View>View>
                                  )}
                        
                          {/* ---- NORMAL MODES (login, register, forgot) ---- */}
                          {mode !== 'new-password' && (
                                                <>
                                                  {/* Mode tabs: Login / Registro */}
                                                  {mode !== 'forgot' && (
                                                                  <View style={{
                                                                                      flexDirection: 'row',
                                                                                      width: '100%',
                                                                                      maxWidth: 360,
                                                                                      backgroundColor: '#18181B',
                                                                                      borderRadius: 14,
                                                                                      padding: 4,
                                                                                      marginBottom: 28,
                                                                  }}>
                                                                    {(['login', 'register'] as const).map(m => (
                                                                                        <Pressable
                                                                                                                key={m}
                                                                                                                onPress={() => switchMode(m)}
                                                                                                                style={{
                                                                                                                                          flex: 1,
                                                                                                                                          paddingVertical: 10,
                                                                                                                                          borderRadius: 10,
                                                                                                                                          alignItems: 'center',
                                                                                                                                          backgroundColor: mode === m ? '#14B8A6' : 'transparent',
                                                                                                                  }}
                                                                                                              >
                                                                                                              <Text style={{
                                                                                                                                        fontSize: 14,
                                                                                                                                        fontWeight: '600',
                                                                                                                                        color: mode === m ? '#fff' : '#71717A',
                                                                                                                }}>
                                                                                                                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                                                                                                                </Text>Text>
                                                                                          </Pressable>Pressable>
                                                                                      ))}
                                                                  </View>View>
                                                              )}
                                                
                                                  {/* Google button */}
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
                                                                                                    borderRadius: 14,
                                                                                                    paddingVertical: 13,
                                                                                                    marginBottom: 20,
                                                                                                    opacity: loading ? 0.6 : 1,
                                                                                                    shadowColor: '#000',
                                                                                                    shadowOffset: { width: 0, height: 1 },
                                                                                                    shadowOpacity: 0.15,
                                                                                                    shadowRadius: 3,
                                                                                                    elevation: 2,
                                                                                }}
                                                                              >
                                                                              <GoogleIcon />
                                                                              <Text style={{ color: '#18181B', fontSize: 15, fontWeight: '700' }}>
                                                                                                Continuar con Google
                                                                              </Text>Text>
                                                              </Pressable>Pressable>
                                                
                                                  {/* Divider */}
                                                              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 360, marginBottom: 20 }}>
                                                                              <View style={{ flex: 1, height: 1, backgroundColor: '#27272A' }} />
                                                                              <Text style={{ color: '#52525B', fontSize: 12, marginHorizontal: 14 }}>o con email</Text>Text>
                                                                              <View style={{ flex: 1, height: 1, backgroundColor: '#27272A' }} />
                                                              </View>View>
                                                
                                                  {/* Forgot header */}
                                                  {mode === 'forgot' && (
                                                                  <View style={{ width: '100%', maxWidth: 360, marginBottom: 20 }}>
                                                                                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#FAFAFA', marginBottom: 6 }}>
                                                                                                        Recuperar contraseña
                                                                                      </Text>Text>
                                                                                    <Text style={{ fontSize: 13, color: '#71717A', lineHeight: 18 }}>
                                                                                                        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                                                                                      </Text>Text>
                                                                  </View>View>
                                                              )}
                                                
                                                  {/* Form */}
                                                              <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
                                                                {/* Email */}
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
                                                              
                                                                {/* Password with eye toggle */}
                                                                {mode !== 'forgot' && (
                                                                    <View style={inputWrapStyle}>
                                                                                        <TextInput
                                                                                                                style={{ ...inputStyle }}
                                                                                                                placeholder="Contraseña"
                                                                                                                placeholderTextColor="#52525B"
                                                                                                                value={password}
                                                                                                                onChangeText={setPassword}
                                                                                                                secureTextEntry={!showPassword}
                                                                                                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                                                                                              />
                                                                                        <Pressable onPress={() => setShowPassword(v => !v)} style={{ paddingHorizontal: 14 }}>
                                                                                                              <Text style={{ color: '#52525B', fontSize: 13 }}>{showPassword ? 'Ocultar' : 'Ver'}</Text>Text>
                                                                                          </Pressable>Pressable>
                                                                    </View>View>
                                                                              )}
                                                              
                                                                {/* Confirm password (register only) */}
                                                                {mode === 'register' && (
                                                                    <View style={inputWrapStyle}>
                                                                                        <TextInput
                                                                                                                style={{ ...inputStyle }}
                                                                                                                placeholder="Confirmar contraseña"
                                                                                                                placeholderTextColor="#52525B"
                                                                                                                value={confirmPassword}
                                                                                                                onChangeText={setConfirmPassword}
                                                                                                                secureTextEntry={!showConfirm}
                                                                                                                autoComplete="new-password"
                                                                                                              />
                                                                                        <Pressable onPress={() => setShowConfirm(v => !v)} style={{ paddingHorizontal: 14 }}>
                                                                                                              <Text style={{ color: '#52525B', fontSize: 13 }}>{showConfirm ? 'Ocultar' : 'Ver'}</Text>Text>
                                                                                          </Pressable>Pressable>
                                                                    </View>View>
                                                                              )}
                                                              
                                                                {/* Error / Success */}
                                                                {error && (
                                                                    <View style={{ backgroundColor: '#450a0a', borderRadius: 10, padding: 10 }}>
                                                                                        <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{error}</Text>Text>
                                                                    </View>View>
                                                                              )}
                                                                {success && (
                                                                    <View style={{ backgroundColor: '#042f2e', borderRadius: 10, padding: 10 }}>
                                                                                        <Text style={{ color: '#5eead4', fontSize: 13, textAlign: 'center' }}>{success}</Text>Text>
                                                                    </View>View>
                                                                              )}
                                                              
                                                                {/* Submit button */}
                                                                              <Pressable
                                                                                                  onPress={handleEmailAuth}
                                                                                                  disabled={loading}
                                                                                                  style={{
                                                                                                                        backgroundColor: '#14B8A6',
                                                                                                                        borderRadius: 14,
                                                                                                                        paddingVertical: 14,
                                                                                                                        alignItems: 'center',
                                                                                                                        opacity: loading ? 0.6 : 1,
                                                                                                                        marginTop: 2,
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
                                                                                                                        </Text>Text>
                                                                                                )}
                                                                              </Pressable>Pressable>
                                                              
                                                                {/* Forgot link (login mode only) */}
                                                                {mode === 'login' && (
                                                                    <Pressable onPress={() => switchMode('forgot')} style={{ alignItems: 'center', paddingVertical: 4 }}>
                                                                                        <Text style={{ color: '#71717A', fontSize: 12 }}>
                                                                                                              ¿Olvidaste tu contraseña?{' '}
                                                                                                              <Text style={{ color: '#14B8A6', fontWeight: '600' }}>Recupérala</Text>Text>
                                                                                          </Text>Text>
                                                                    </Pressable>Pressable>
                                                                              )}
                                                              
                                                                {/* Back to login (forgot mode) */}
                                                                {mode === 'forgot' && (
                                                                    <Pressable onPress={() => switchMode('login')} style={{ alignItems: 'center', paddingVertical: 4 }}>
                                                                                        <Text style={{ color: '#14B8A6', fontSize: 13, fontWeight: '600' }}>
                                                                                                              ← Volver al inicio de sesión
                                                                                          </Text>Text>
                                                                    </Pressable>Pressable>
                                                                              )}
                                                              </View>View>
                                                </>>
                                              )}
                        
                          {/* Footer legal */}
                                  <Text style={{ color: '#3F3F46', fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 16 }}>
                                              Al continuar aceptas nuestros Términos de servicio{'\n'}y Política de privacidad.
                                  </Text>Text>
                        </ScrollView>ScrollView>
                </KeyboardAvoidingView>KeyboardAvoidingView>
        </SafeAreaView>SafeAreaView>
      );
}
</></KeyboardAvoidingView>
