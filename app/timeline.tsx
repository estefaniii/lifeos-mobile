import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useDailyTimeline } from '@/hooks/use-daily-timeline';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
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
  const colors = useColors();
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
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 24 }}>←</Text>
          </Pressable>
          <View>
            <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800' }}>Timeline</Text>
            <Text style={{ color: '#A1A1AA', fontSize: 13 }}>Tu actividad día a día</Text>
          </View>
        </View>

        {/* Week Navigation */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Pressable onPress={() => goDay(-7)} style={{ padding: 8 }}>
            <Text style={{ color: '#14B8A6', fontSize: 20 }}>‹</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'center' }}>
            {weekDates.map((d) => {
              const ds = formatDateStr(d);
              const isSelected = ds === dateStr;
              const isToday = ds === today;
              return (
                <Pressable
                  key={ds}
                  onPress={() => setSelectedDate(d)}
                  style={{
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 14,
                    backgroundColor: isSelected ? '#14B8A6' : 'transparent',
                  }}
                >
                  <Text style={{
                    color: isSelected ? '#020617' : '#71717A',
                    fontSize: 10,
                    fontWeight: '600',
                  }}>
                    {DAYS_ES[d.getDay()]}
                  </Text>
                  <Text style={{
                    color: isSelected ? '#020617' : isToday ? '#14B8A6' : '#FAFAFA',
                    fontSize: 16,
                    fontWeight: '700',
                    marginTop: 2,
                  }}>
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => goDay(7)} style={{ padding: 8 }}>
            <Text style={{ color: '#14B8A6', fontSize: 20 }}>›</Text>
          </Pressable>
        </View>

        {/* Month label */}
        <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
          {MONTHS_ES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          {dateStr === today ? '  ·  Hoy' : ''}
        </Text>

        {/* Timeline Events */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : events && events.length > 0 ? (
          <View>
            {events.map((event, index) => (
              <View key={event.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
                {/* Timeline line */}
                <View style={{ width: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#71717A', fontSize: 9, marginBottom: 4 }}>{event.time}</Text>
                  <View style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: event.color,
                  }} />
                  {index < events.length - 1 && (
                    <View style={{
                      width: 2,
                      flex: 1,
                      minHeight: 30,
                      backgroundColor: '#1e293b',
                    }} />
                  )}
                </View>

                {/* Event card */}
                <View style={{
                  flex: 1,
                  marginLeft: 10,
                  marginBottom: 12,
                  backgroundColor: '#0f172a',
                  borderRadius: 14,
                  padding: 14,
                  borderLeftWidth: 3,
                  borderLeftColor: event.color,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 18 }}>{event.icon}</Text>
                    <Text style={{ color: '#FAFAFA', fontSize: 14, fontWeight: '700' }}>{event.title}</Text>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>{event.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{
            paddingVertical: 40,
            alignItems: 'center',
            backgroundColor: '#0f172a',
            borderRadius: 16,
          }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={{ color: '#71717A', fontSize: 14, fontWeight: '600' }}>Sin actividad este día</Text>
            <Text style={{ color: '#52525b', fontSize: 12, marginTop: 4 }}>Registra transacciones, hábitos o salud para verlos aquí</Text>
          </View>
        )}

        {/* Quick stats footer */}
        {events && events.length > 0 && (
          <View style={{
            marginTop: 16,
            backgroundColor: '#0f172a',
            borderRadius: 14,
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 20, fontWeight: '700' }}>
                {events.length}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 10 }}>Eventos</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#34d399', fontSize: 20, fontWeight: '700' }}>
                {events.filter(e => e.type === 'income').length}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 10 }}>Ingresos</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#f87171', fontSize: 20, fontWeight: '700' }}>
                {events.filter(e => e.type === 'expense').length}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 10 }}>Gastos</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#14b8a6', fontSize: 20, fontWeight: '700' }}>
                {events.filter(e => e.type === 'habit').length}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 10 }}>Hábitos</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
