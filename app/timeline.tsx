import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, TINTA, RADIO } from '@/components/decor';
import { useDailyTimeline } from '@/hooks/use-daily-timeline';
import { fechaLocal } from '@/lib/registros';
import { ACENTOS } from '@/constants/tabs';

// Historial del día: una línea de tiempo con lo que registraste.
const MENTA = ACENTOS.finanzas;
const CORAL = ACENTOS.ejercicio;
const ALTO = TINTA.elevada;

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatDateStr(date: Date): string {
  return fechaLocal(date);
}

function getWeekDates(centerDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function TimelineScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = formatDateStr(selectedDate);
  const { data: events, isLoading } = useDailyTimeline(dateStr);

  const weekDates = getWeekDates(selectedDate);
  const today = formatDateStr(new Date());

  const goDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 20 }}>
          {/* Cabecera: deja libre la esquina del botón de menú */}
          <View style={{ paddingRight: 110 }}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver"
              style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginBottom: 4 }}>
              <Text style={{ color: TINTA.suave, fontSize: 15, fontWeight: '700' }}>‹ Volver</Text>
            </Pressable>
            <Titulo>Tu día</Titulo>
            <Text style={{ color: TINTA.suave, fontSize: 15, marginTop: 6 }}>Lo que registraste, en orden.</Text>
          </View>

          {/* Semana */}
          <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1, borderColor: TINTA.borde, padding: 8, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable onPress={() => goDay(-7)} accessibilityRole="button" accessibilityLabel="Semana anterior"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: TINTA.texto, fontSize: 22 }}>‹</Text>
              </Pressable>
              <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '800' }}>
                {MONTHS_ES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                {dateStr === today ? <Text style={{ color: TINTA.suave, fontWeight: '600' }}>  ·  Hoy</Text> : null}
              </Text>
              <Pressable onPress={() => goDay(7)} accessibilityRole="button" accessibilityLabel="Semana siguiente"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: TINTA.texto, fontSize: 22 }}>›</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {weekDates.map((d) => {
                const ds = formatDateStr(d);
                const isSelected = ds === dateStr;
                const isToday = ds === today;
                return (
                  <Pressable
                    key={ds}
                    onPress={() => setSelectedDate(d)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16,
                      backgroundColor: isSelected ? ACENTOS.inicio : 'transparent',
                      borderWidth: isToday && !isSelected ? 1 : 0, borderColor: TINTA.borde,
                    }}
                  >
                    <Text style={{ color: isSelected ? TINTA.sobreAcento : TINTA.suave, fontSize: 12, fontWeight: '700' }}>
                      {DAYS_ES[d.getDay()]}
                    </Text>
                    <Text style={{ color: isSelected ? TINTA.sobreAcento : TINTA.texto, fontSize: 17, fontWeight: '800', marginTop: 2 }}>
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Eventos */}
          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={TINTA.suave} />
            </View>
          ) : events && events.length > 0 ? (
            <View>
              {events.map((event, index) => (
                <View key={event.id} style={{ flexDirection: 'row' }}>
                  {/* Hora y línea */}
                  <View style={{ width: 48, alignItems: 'center' }}>
                    <Text style={{ color: TINTA.suave, fontSize: 12, fontWeight: '600', marginTop: 16 }}>{event.time}</Text>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: event.color, marginTop: 6 }} />
                    {index < events.length - 1 && (
                      <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: TINTA.borde, marginTop: 4 }} />
                    )}
                  </View>

                  <View style={{
                    flex: 1, marginLeft: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1, borderColor: TINTA.borde, padding: 14,
                  }}>
                    <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: ALTO, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{event.icon}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '800' }} numberOfLines={2}>{event.title}</Text>
                      {!!event.detail && <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 2 }}>{event.detail}</Text>}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1, borderColor: TINTA.borde }}>
              <Titulo size={22} style={{ textAlign: 'center' }}>Sin actividad este día</Titulo>
              <Text style={{ color: TINTA.suave, fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 21 }}>
                Registra movimientos, hábitos o salud y aparecerán aquí.
              </Text>
            </View>
          )}

          {/* Resumen del día */}
          {events && events.length > 0 && (
            <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1, borderColor: TINTA.borde, paddingVertical: 16, flexDirection: 'row' }}>
              {[
                { n: events.length, t: 'Eventos', c: TINTA.texto },
                { n: events.filter(e => e.type === 'income').length, t: 'Ingresos', c: MENTA },
                { n: events.filter(e => e.type === 'expense').length, t: 'Gastos', c: CORAL },
                { n: events.filter(e => e.type === 'habit').length, t: 'Hábitos', c: TINTA.texto },
              ].map((x, i) => (
                <View key={x.t} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderColor: TINTA.borde }}>
                  <Titulo size={24} color={x.c}>{x.n}</Titulo>
                  <Text style={{ color: TINTA.suave, fontSize: 13, marginTop: 2 }}>{x.t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
