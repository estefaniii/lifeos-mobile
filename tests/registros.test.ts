import { describe, expect, it } from 'vitest';
import { agruparPorDia, deFecha, duracion, fechaLocal, horaCorta, inicioSemana, minutosSemana, tituloDia, type Registro } from '../lib/registros';

const hoy = new Date(2026, 10, 1, 21, 30); // domingo 1 nov, 9:30 p. m.

describe('fechas locales', () => {
  it('a las 9 p. m. sigue siendo hoy, no mañana como con toISOString', () => {
    expect(fechaLocal(hoy)).toBe('2026-11-01');
  });

  it('una columna DATE se lee como ese mismo día', () => {
    expect(fechaLocal(deFecha('2026-10-28'))).toBe('2026-10-28');
  });

  it('pone nombre a los días', () => {
    expect(tituloDia('2026-11-01', hoy)).toBe('Hoy');
    expect(tituloDia('2026-10-31', hoy)).toBe('Ayer');
    expect(tituloDia('2026-10-28', hoy)).toBe('miércoles 28 oct');
  });

  it('hora corta en 12 horas', () => {
    expect(horaCorta(new Date(2026, 10, 1, 0, 5).toISOString())).toBe('12:05 a. m.');
    expect(horaCorta(new Date(2026, 10, 1, 14, 40).toISOString())).toBe('2:40 p. m.');
  });
});

describe('agruparPorDia', () => {
  const at = (d: number, h: number) => new Date(2026, 10, d, h, 0).toISOString();
  const registros: Registro[] = [
    { id: '1', tipo: 'agua', at: at(1, 8), titulo: 'Agua', cantidad: 1 },
    { id: '2', tipo: 'agua', at: at(1, 11), titulo: 'Agua', cantidad: 2 },
    { id: '3', tipo: 'ejercicio', at: at(1, 7), titulo: 'Piernas', cantidad: 30 },
    { id: '4', tipo: 'comida', at: at(1, 13), titulo: 'Almuerzo' },
    { id: '5', tipo: 'habito', at: new Date(2026, 9, 31, 22).toISOString(), titulo: 'Leer' },
    { id: '6', tipo: 'hobby', at: new Date(2026, 9, 31, 18).toISOString(), titulo: 'Tejido', cantidad: 45 },
  ];

  it('separa por día, el más reciente primero, y ordena cada día por hora', () => {
    const dias = agruparPorDia(registros, hoy);
    expect(dias.map((d) => d.titulo)).toEqual(['Hoy', 'Ayer']);
    expect(dias[0].registros.map((r) => r.id)).toEqual(['4', '2', '1', '3']);
  });

  it('suma lo de cada día', () => {
    const [d0, d1] = agruparPorDia(registros, hoy);
    expect(d0.resumen).toEqual({ vasos: 3, minutosEjercicio: 30, comidas: 1, habitos: 0, minutosHobby: 0 });
    expect(d1.resumen.habitos).toBe(1);
    expect(d1.resumen.minutosHobby).toBe(45);
  });

  it('sin registros no hay días', () => {
    expect(agruparPorDia([], hoy)).toEqual([]);
  });
});

describe('hobbies', () => {
  it('la semana empieza el lunes', () => {
    expect(fechaLocal(inicioSemana(hoy))).toBe('2026-10-26');
  });

  it('solo cuenta los minutos de esta semana', () => {
    const s = [
      { hobby_id: 'a', minutes: 30, done_at: new Date(2026, 9, 27, 10).toISOString() },
      { hobby_id: 'a', minutes: 20, done_at: new Date(2026, 10, 1, 10).toISOString() },
      { hobby_id: 'a', minutes: 99, done_at: new Date(2026, 9, 25, 10).toISOString() },
      { hobby_id: 'b', minutes: 15, done_at: new Date(2026, 9, 30, 10).toISOString() },
    ];
    expect(minutosSemana(s, hoy)).toEqual({ a: 50, b: 15 });
  });

  it('escribe la duración', () => {
    expect(duracion(45)).toBe('45 min');
    expect(duracion(60)).toBe('1 h');
    expect(duracion(95)).toBe('1 h 35 min');
  });
});

describe('hora de inicio del día y rachas', () => {
  it('con el día empezando a las 4, la 1 a. m. cuenta para ayer', async () => {
    const { setHoraInicioDia, fechaLocal: f } = await import('../lib/registros');
    setHoraInicioDia(4);
    expect(f(new Date(2026, 10, 2, 1, 30))).toBe('2026-11-01');
    expect(f(new Date(2026, 10, 2, 4, 30))).toBe('2026-11-02');
    setHoraInicioDia(0);
    expect(f(new Date(2026, 10, 2, 1, 30))).toBe('2026-11-02');
  });

  it('cuenta los días seguidos y no se rompe si hoy aún no se cumplió', async () => {
    const { racha, hitoRacha } = await import('../lib/registros');
    const hoy = new Date(2026, 10, 5, 9);
    expect(racha(['2026-11-05', '2026-11-04', '2026-11-03'], hoy)).toBe(3);
    expect(racha(['2026-11-04', '2026-11-03'], hoy)).toBe(2);
    expect(racha(['2026-11-03'], hoy)).toBe(0);
    expect(hitoRacha(6)).toBeNull();
    expect(hitoRacha(15)).toBe(14);
  });
});
