import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, Platform, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, Sticker, Chispa, TINTA, acentoTexto, RADIO } from '@/components/decor';
import { useFotosProgreso, useProgresoActions, type FotoProgreso } from '@/hooks/use-progreso';
import { deFecha } from '@/lib/registros';
import { ACENTOS } from '@/constants/tabs';

// Mi progreso: fotos del cuerpo para ver el cambio con el tiempo. Solo las ves tú.
const CORAL = ACENTOS.ejercicio;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaCorta = (s: string) => { const d = deFecha(s); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}` };
const diasEntre = (a: string, b: string) => Math.round((deFecha(b).getTime() - deFecha(a).getTime()) / 86_400_000);

export default function ProgresoScreen() {
  const { data: fotos = [], isLoading, error } = useFotosProgreso();
  const { subir, borrar } = useProgresoActions();
  const [aviso, setAviso] = useState('');
  const primera = fotos[fotos.length - 1];
  const ultima = fotos[0];

  const agregar = async () => {
    setAviso('');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (r.canceled) return;
    subir.mutate({ uri: r.assets[0].uri, mime: r.assets[0].mimeType }, { onError: (e) => setAviso(`No pude subirla: ${(e as Error).message}`) });
  };
  const quitar = (f: FotoProgreso) => {
    const si = () => borrar.mutate(f);
    if (Platform.OS === 'web') { if (window.confirm('¿Borrar esta foto?')) si() }
    else Alert.alert('¿Borrar esta foto?', undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Borrar', style: 'destructive', onPress: si }]);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 18 }}>
          <View style={{ paddingRight: 60 }}>
            <Titulo>Mi progreso</Titulo>
            <Text style={{ color: TINTA.suave, fontSize: 15, marginTop: 6 }}>Fotos de tu cuerpo para ver el cambio. Solo las ves tú.</Text>
          </View>

          <Pressable onPress={agregar} disabled={subir.isPending} accessibilityRole="button"
            style={{ minHeight: 52, borderRadius: 20, backgroundColor: CORAL, alignItems: 'center', justifyContent: 'center' }}>
            {subir.isPending ? <ActivityIndicator color={TINTA.sobreAcento} /> : <Text style={{ color: TINTA.sobreAcento, fontWeight: '900', fontSize: 16 }}>📷 Añadir la foto de hoy</Text>}
          </Pressable>
          {!!aviso && <Text style={{ color: acentoTexto(ACENTOS.inicio) }}>{aviso}</Text>}
          {error && <Text style={{ color: acentoTexto(ACENTOS.inicio) }}>No pude cargar tus fotos. Revisa la conexión.</Text>}

          {/* Antes y ahora, cuando hay al menos dos */}
          {primera && ultima && primera.id !== ultima.id && (
            <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1, borderColor: TINTA.borde, padding: 16 }}>
              <Sticker texto={`${diasEntre(primera.taken_on, ultima.taken_on)} días`} color={CORAL} giro={-6} style={{ position: 'absolute', top: -12, right: 18 }} />
              <Titulo size={22} style={{ marginBottom: 12 }}>Antes y ahora</Titulo>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[primera, ultima].map((f, k) => (
                  <View key={f.id} style={{ flex: 1 }}>
                    {f.url ? <Image source={{ uri: f.url }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 16 }} contentFit="cover" />
                      : <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: TINTA.elevada }} />}
                    <Text style={{ color: TINTA.texto, fontWeight: '800', marginTop: 6 }}>{k ? 'Ahora' : 'Antes'}</Text>
                    <Text style={{ color: TINTA.suave, fontSize: 12.5 }}>{fechaCorta(f.taken_on)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!isLoading && fotos.length === 0 && (
            <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, padding: 22, borderWidth: 1, borderColor: TINTA.borde }}>
              <Chispa size={24} color={CORAL} style={{ position: 'absolute', top: -10, right: 30 }} />
              <Text style={{ fontSize: 36 }}>🪞</Text>
              <Titulo size={22} style={{ marginTop: 8 }}>Tu primera foto</Titulo>
              <Text style={{ color: TINTA.suave, marginTop: 6, lineHeight: 20 }}>Misma luz, misma ropa y mismo lugar cada vez: así se nota el cambio. Una foto por semana basta.</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {fotos.map((f) => (
              <View key={f.id} style={{ flexBasis: '31%', flexGrow: 1, maxWidth: '33%' }}>
                {f.url ? <Image source={{ uri: f.url }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 14 }} contentFit="cover" />
                  : <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 14, backgroundColor: TINTA.elevada }} />}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: TINTA.suave, fontSize: 12 }}>{fechaCorta(f.taken_on)}</Text>
                  <Pressable onPress={() => quitar(f)} accessibilityLabel={`Borrar la foto del ${fechaCorta(f.taken_on)}`} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: TINTA.suave, fontSize: 18 }}>×</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
