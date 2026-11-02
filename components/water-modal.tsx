// Registrar agua: cada toque queda guardado con su hora, y abajo se ven los de hoy
// para deshacer uno si fue sin querer. Lo usan Inicio y Salud.
import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { useLifeLogsHoy, useRegistrar, useBorrarRegistro, ML_POR_VASO } from '@/hooks/use-registros';
import { horaCorta } from '@/lib/registros';

const META = 8;

export function WaterModal({ visible, onClose, currentWater, onSave }: {
  visible: boolean;
  onClose: () => void;
  currentWater: number;
  onSave?: () => void;
}) {
  const { data: logs = [] } = useLifeLogsHoy();
  const registrar = useRegistrar();
  const borrar = useBorrarRegistro();
  const [aviso, setAviso] = useState('');
  const vasos = Math.round(currentWater / ML_POR_VASO);
  const deHoy = logs.filter((l) => l.kind === 'agua');

  const sumar = (n: number) => {
    setAviso('');
    registrar.mutate({ kind: 'agua', amount: n }, {
      onSuccess: () => onSave?.(),
      // El total sí se guardó; lo que falló es la hora (tabla sin crear o sin conexión)
      onError: () => { setAviso('Sumé el agua, pero no pude guardar la hora del registro.'); onSave?.() },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} accessibilityLabel="Cerrar" />
      <View style={{ backgroundColor: '#1A1714', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: '#2E2924', maxHeight: '80%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <View>
            <Text style={{ color: '#F5EFE8', fontSize: 22, fontWeight: '800' }}>Agua</Text>
            <Text style={{ color: '#A39A90', fontSize: 14, marginTop: 2 }}>Meta: {META} vasos de {ML_POR_VASO} ml</Text>
          </View>
          <Text style={{ color: '#7CC4FF', fontSize: 40, fontWeight: '900', lineHeight: 42 }}>
            {vasos}<Text style={{ color: '#A39A90', fontSize: 18, fontWeight: '700' }}>/{META}</Text>
          </Text>
        </View>

        {/* Los vasos del día: llenos los tomados */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
          {Array.from({ length: META }).map((_, k) => (
            <View key={k} style={{ flex: 1, height: 34, borderRadius: 8, borderWidth: 1.5, borderColor: '#7CC4FF', backgroundColor: k < vasos ? '#7CC4FF' : 'transparent' }} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          <Pressable onPress={() => sumar(1)} disabled={registrar.isPending} accessibilityRole="button"
            style={{ flex: 2, minHeight: 56, borderRadius: 20, backgroundColor: '#7CC4FF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#0E1A24', fontWeight: '900', fontSize: 17 }}>+1 vaso</Text>
          </Pressable>
          <Pressable onPress={() => sumar(2)} disabled={registrar.isPending} accessibilityRole="button"
            style={{ flex: 1, minHeight: 56, borderRadius: 20, borderWidth: 1.5, borderColor: '#7CC4FF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#7CC4FF', fontWeight: '800', fontSize: 15 }}>+2</Text>
          </Pressable>
        </View>
        {!!aviso && <Text style={{ color: '#FBBF24', fontSize: 13, marginTop: 4 }}>{aviso}</Text>}

        <Text style={{ color: '#A39A90', fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6 }}>Hoy</Text>
        <ScrollView style={{ maxHeight: 200 }}>
          {deHoy.length === 0 && <Text style={{ color: '#A39A90', fontSize: 14, paddingVertical: 6 }}>Todavía nada. El primer vaso queda aquí con su hora.</Text>}
          {deHoy.map((l) => (
            <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, borderTopWidth: 1, borderTopColor: '#2E2924' }}>
              <Text style={{ color: '#F5EFE8', fontSize: 15, fontWeight: '700', width: 92 }}>{horaCorta(l.logged_at)}</Text>
              <Text style={{ color: '#F5EFE8', fontSize: 15, flex: 1 }}>{l.amount} {Number(l.amount) === 1 ? 'vaso' : 'vasos'}</Text>
              <Pressable
                onPress={() => borrar.mutate({ id: l.id, tipo: 'agua', at: l.logged_at, titulo: '', cantidad: Number(l.amount) }, { onSuccess: () => onSave?.() })}
                accessibilityLabel={`Quitar el registro de las ${horaCorta(l.logged_at)}`}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#A39A90', fontSize: 20 }}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Pressable onPress={onClose} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <Text style={{ color: '#A39A90', fontWeight: '700', fontSize: 15 }}>Listo</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
