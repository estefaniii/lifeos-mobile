import { describe, expect, it } from 'vitest';
import { ahoraEn, conDefectos, deMinutos, horaBonita, pendientes, RECORDATORIOS } from '../lib/recordatorios';

describe('recordatorios', () => {
  it('sin nada guardado salen los de fábrica', () => {
    const r = conDefectos(null);
    expect(r.dormir).toEqual({ on: true, horas: ['22:30'] });
    expect(r.finanzas.on).toBe(false);
  });

  it('lo guardado manda, y una hora inválida se descarta', () => {
    const r = conDefectos({ dormir: { on: false, horas: ['23:00', '25:99'] } });
    expect(r.dormir).toEqual({ on: false, horas: ['23:00'] });
  });

  it('las afirmaciones no están: son de Presence', () => {
    expect(RECORDATORIOS.map((r) => r.clave)).not.toContain('afirmaciones' as never);
  });

  it('toca si la hora cayó en los últimos 15 minutos', () => {
    const a = conDefectos({});
    const ahora = { fecha: '2026-11-01', minutos: 22 * 60 + 34 };
    expect(pendientes(a, ahora)).toEqual([{ clave: 'dormir', slot: '2026-11-01 22:30' }]);
  });

  it('no toca antes de la hora ni pasado el margen', () => {
    const a = conDefectos({});
    expect(pendientes(a, { fecha: '2026-11-01', minutos: 22 * 60 + 29 })).toEqual([]);
    expect(pendientes(a, { fecha: '2026-11-01', minutos: 22 * 60 + 45 })).toEqual([]);
  });

  it('apagado no se envía', () => {
    const a = conDefectos({ dormir: { on: false } });
    expect(pendientes(a, { fecha: '2026-11-01', minutos: 22 * 60 + 31 })).toEqual([]);
  });

  it('la hora local sale de la zona, no del servidor', () => {
    // 03:10 UTC del 2 de noviembre = 22:10 del 1 en Panamá
    const r = ahoraEn('America/Panama', new Date(Date.UTC(2026, 10, 2, 3, 10)));
    expect(r).toMatchObject({ fecha: '2026-11-01', minutos: 22 * 60 + 10 });
  });

  it('formatea horas', () => {
    expect(horaBonita('09:00')).toBe('9:00 a. m.');
    expect(horaBonita('22:30')).toBe('10:30 p. m.');
    expect(deMinutos(-30)).toBe('23:30');
    expect(deMinutos(24 * 60 + 15)).toBe('00:15');
  });
});

describe('recordatorios por día', () => {
  it('el resumen solo sale el domingo', () => {
    const a = conDefectos({});
    const domingo = { fecha: '2026-11-01', minutos: 19 * 60 + 2, diaSemana: 0, diaMes: 1 };
    const lunes = { fecha: '2026-11-02', minutos: 19 * 60 + 2, diaSemana: 1, diaMes: 2 };
    expect(pendientes(a, domingo).map((p) => p.clave)).toContain('resumen');
    expect(pendientes(a, lunes).map((p) => p.clave)).not.toContain('resumen');
  });

  it('la copia sale el día 1 del mes', () => {
    const a = conDefectos({});
    expect(pendientes(a, { fecha: '2026-12-01', minutos: 10 * 60 + 1, diaSemana: 2, diaMes: 1 }).map((p) => p.clave)).toContain('copia');
    expect(pendientes(a, { fecha: '2026-12-02', minutos: 10 * 60 + 1, diaSemana: 3, diaMes: 2 }).map((p) => p.clave)).not.toContain('copia');
  });

  it('ahoraEn trae el día de la semana y del mes', () => {
    expect(ahoraEn('America/Panama', new Date(Date.UTC(2026, 10, 2, 3, 10)))).toMatchObject({ diaSemana: 0, diaMes: 1 });
  });
});
