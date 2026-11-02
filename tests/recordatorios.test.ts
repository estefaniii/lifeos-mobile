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
    expect(r).toEqual({ fecha: '2026-11-01', minutos: 22 * 60 + 10 });
  });

  it('formatea horas', () => {
    expect(horaBonita('09:00')).toBe('9:00 a. m.');
    expect(horaBonita('22:30')).toBe('10:30 p. m.');
    expect(deMinutos(-30)).toBe('23:30');
    expect(deMinutos(24 * 60 + 15)).toBe('00:15');
  });
});
