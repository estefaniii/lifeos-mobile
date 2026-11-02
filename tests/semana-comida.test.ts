import { describe, expect, it } from 'vitest';
import {
  claveIngrediente, etiquetaComida, formatoCantidad, haySeguidas, huecosLlenos, ingredientesDelPlan,
  juntarIngredientes, leerIngrediente, pluralizar, marcadasHoy, repartirMomento, repartirSemana, siguienteOpcion, sinLoQueYaHay,
  pasilloDe, porPasillo,
} from '../lib/semana-comida';

// Azar fijo para que las pruebas no dependan de la suerte
const fijo = () => 0.3;

describe('repartir la semana', () => {
  it('con dos o más opciones nunca repite la misma receta dos días seguidos', () => {
    for (const n of [2, 3, 4, 5]) {
      const opciones = Array.from({ length: n }, (_, i) => `Receta ${i}`);
      for (let k = 0; k < 20; k++) {
        const dias = repartirMomento(opciones, 7, Math.random);
        expect(dias).toHaveLength(7);
        expect(haySeguidas(dias)).toBe(false);
      }
    }
  });

  it('reparte parejo: con 3 opciones ninguna sale más de 3 veces', () => {
    const dias = repartirMomento(['A', 'B', 'C'], 7, fijo);
    const cuenta = ['A', 'B', 'C'].map((x) => dias.filter((d) => d === x).length);
    expect(Math.max(...cuenta)).toBe(3);
    expect(Math.min(...cuenta)).toBe(2);
  });

  it('con una sola opción la pone los 7 días, y sin opciones no devuelve nada', () => {
    expect(repartirMomento(['Lentejas guisadas'])).toEqual(Array(7).fill('Lentejas guisadas'));
    expect(repartirMomento([])).toEqual([]);
  });

  it('solo genera filas para los momentos con algo elegido', () => {
    const filas = repartirSemana({ almuerzo: ['A', 'B'], cena: [] }, fijo);
    expect(filas).toHaveLength(7);
    expect(filas.every((f) => f.slot === 'almuerzo')).toBe(true);
    expect(filas.map((f) => f.day)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('tocar un hueco pasa a la siguiente opción y vuelve a la primera', () => {
    expect(siguienteOpcion(['A', 'B', 'C'], 'A')).toBe('B');
    expect(siguienteOpcion(['A', 'B', 'C'], 'C')).toBe('A');
    expect(siguienteOpcion(['A', 'B'], 'otra cosa')).toBe('A');
  });
});

describe('leer ingredientes', () => {
  it('entiende enteros, fracciones y mixtos', () => {
    expect(leerIngrediente('2 dientes de ajo')).toEqual({ cantidad: 2, resto: 'dientes de ajo' });
    expect(leerIngrediente('1/2 aguacate')).toEqual({ cantidad: 0.5, resto: 'aguacate' });
    expect(leerIngrediente('1 1/2 taza de lentejas')).toEqual({ cantidad: 1.5, resto: 'taza de lentejas' });
    expect(leerIngrediente('Sal y pimienta')).toEqual({ cantidad: null, resto: 'Sal y pimienta' });
  });

  it('la clave no distingue singular, plural, tildes ni mayúsculas', () => {
    expect(claveIngrediente('diente de ajo')).toBe(claveIngrediente('Dientes de ajo'));
    expect(claveIngrediente('limón')).toBe(claveIngrediente('limones'));
    expect(claveIngrediente('taza de avena')).toBe(claveIngrediente('tazas de avena'));
    expect(claveIngrediente('cebolla')).not.toBe(claveIngrediente('cebolla morada'));
  });

  it('escribe las cantidades como en una receta', () => {
    expect(formatoCantidad(3)).toBe('3');
    expect(formatoCantidad(0.5)).toBe('1/2');
    expect(formatoCantidad(1.5)).toBe('1 1/2');
    expect(formatoCantidad(1.75)).toBe('1 3/4');
    expect(formatoCantidad(0.2)).toBe('0,2');
  });
});

describe('juntar ingredientes', () => {
  it('suma lo que tiene cantidad y usa la forma en plural', () => {
    expect(juntarIngredientes([['2 dientes de ajo'], ['3 dientes de ajo'], ['1 diente de ajo']])).toEqual(['6 dientes de ajo']);
    expect(juntarIngredientes([['1/2 aguacate'], ['1/2 aguacate']])).toEqual(['1 aguacate']);
  });

  it('cuenta con ×N lo que se repite sin cantidad', () => {
    expect(juntarIngredientes([['Cilantro'], ['cilantro'], ['Cilantro']])).toEqual(['Cilantro ×3']);
  });

  it('forma el plural cuando ninguna línea lo traía', () => {
    expect(juntarIngredientes([['1 cebolla'], ['1 cebolla'], ['1 cebolla']])).toEqual(['3 cebollas']);
    expect(juntarIngredientes([['1 limón'], ['1 limón']])).toEqual(['2 limones']);
    expect(juntarIngredientes([['1 1/2 taza de avena'], ['1/2 taza de avena']])).toEqual(['2 tazas de avena']);
    expect(pluralizar('g de hongos')).toBe('g de hongos');
    expect(pluralizar('lápiz')).toBe('lápices');
    expect(pluralizar('pimentón rojo')).toBe('pimentones rojos');
    expect(pluralizar('plátano maduro (cáscara negra)')).toBe('plátanos maduros (cáscara negra)');
    expect(pluralizar('hongo en láminas')).toBe('hongos en láminas');
  });

  it('no mezcla ingredientes distintos ni pierde los que no se repiten', () => {
    const out = juntarIngredientes([['1 cebolla', 'Sal'], ['1/2 cebolla morada', '2 huevos'], ['1 huevo']]);
    expect(out).toEqual(['1 cebolla', 'Sal', '1/2 cebolla morada', '3 huevos']);
  });

  it('nunca deja dos líneas del mismo ingrediente', () => {
    const out = juntarIngredientes([['2 huevos', 'Sal'], ['3 huevos', 'sal'], ['Huevos']]);
    expect(out.filter((l) => /huevo/i.test(l))).toHaveLength(1);
    expect(out.filter((l) => /sal/i.test(l))).toHaveLength(1);
  });
});

describe('ingredientes del plan', () => {
  const recetas = [
    { titulo: 'Lentejas', porciones: 4, ingredientes: ['1 cebolla', '2 dientes de ajo'] },
    { titulo: 'Tostada', porciones: 1, ingredientes: ['1 huevo', '1/2 aguacate'] },
  ];

  it('una receta de 4 porciones puesta 3 días se cocina una sola vez', () => {
    expect(ingredientesDelPlan(['Lentejas', 'Lentejas', 'Lentejas'], recetas)).toEqual(['1 cebolla', '2 dientes de ajo']);
  });

  it('una de 1 porción se multiplica por cada día', () => {
    expect(ingredientesDelPlan(['Tostada', 'Tostada', 'Tostada'], recetas)).toEqual(['3 huevos', '1 1/2 aguacates']);
  });

  it('lo escrito a mano que no es receta no suma ingredientes', () => {
    expect(ingredientesDelPlan(['Pizza con amigas', ''], recetas)).toEqual([]);
  });

  it('no vuelve a mandar lo que ya está pendiente en compras', () => {
    expect(sinLoQueYaHay(['1 cebolla', 'Sal'], [{ name: '1 cebolla', done: false }, { name: 'Sal', done: true }])).toEqual(['Sal']);
  });
});

describe('check de hoy', () => {
  it('la etiqueta es «Momento: receta»', () => {
    expect(etiquetaComida('almuerzo', 'Lentejas guisadas')).toBe('Almuerzo: Lentejas guisadas');
  });

  it('marca solo los momentos cuyo registro de comida coincide', () => {
    const hoy = { desayuno: 'Batido verde', almuerzo: 'Lentejas guisadas', cena: 'Crema de auyama' };
    const logs = [
      { kind: 'comida', label: 'Almuerzo: Lentejas guisadas' },
      { kind: 'agua', label: 'Desayuno: Batido verde' },
      { kind: 'comida', label: 'Cena: otra cosa' },
    ];
    expect([...marcadasHoy(hoy, logs)]).toEqual(['almuerzo']);
  });

  it('cuenta los huecos llenos de la semana sin contar vacíos ni repetidos', () => {
    const plan = [
      { day: 0, slot: 'desayuno' as const, meal: 'A' },
      { day: 0, slot: 'desayuno' as const, meal: 'A' },
      { day: 1, slot: 'cena' as const, meal: '  ' },
      { day: 6, slot: 'cena' as const, meal: 'B' },
    ];
    expect(huecosLlenos(plan)).toBe(2);
  });
});

describe('pasillos del súper', () => {
  it('pone cada ingrediente real de las recetas en su pasillo', () => {
    const casos: [string, string][] = [
      ['2 aguacates maduros', 'frutas'], ['1 kg de ñame', 'frutas'], ['1 ají chombo', 'frutas'], ['Hojas de menta', 'frutas'],
      ['500 g de filete de corvina fresca', 'carnes'], ['2 muslos de pollo sin hueso', 'carnes'], ['300 g de camarones pelados', 'carnes'],
      ['Queso feta', 'lacteos'], ['4 huevos', 'lacteos'], ['1 taza de leche o bebida vegetal', 'lacteos'],
      ['6 tortillas de trigo', 'panaderia'], ['1 rebanada de pan integral', 'panaderia'],
      ['1 lata de frijoles negros', 'despensa'], ['2 cdas de curry en polvo', 'despensa'], ['Sal y pimienta', 'despensa'], ['200 g de pasta integral', 'despensa'],
      ['100 g de pulpa de açaí congelada', 'congelados'], ['1 plátano congelado', 'congelados'],
      ['1 1/4 taza de agua tibia', 'otros'],
    ];
    for (const [ing, pasillo] of casos) expect([ing, pasilloDe(ing)]).toEqual([ing, pasillo]);
  });

  it('decide por la primera palabra y, a igual posición, por la más larga', () => {
    expect(pasilloDe('Culantro y sal')).toBe('frutas');
    expect(pasilloDe('Sal, pimienta y eneldo')).toBe('despensa');
    expect(pasilloDe('4 tazas de caldo de pollo')).toBe('despensa');
    expect(pasilloDe('1 lata de atún en agua')).toBe('despensa');
    expect(pasilloDe('1 lata de leche de coco')).toBe('despensa');
    expect(pasilloDe('1 cda de mantequilla de maní')).toBe('despensa');
    expect(pasilloDe('Pimentón en polvo')).toBe('despensa');
    expect(pasilloDe('1 pimentón rojo')).toBe('frutas');
    expect(pasilloDe('1 taza de harina de maíz precocida')).toBe('despensa');
    expect(pasilloDe('2 mazorcas de maíz')).toBe('frutas');
  });

  it('acepta plurales y lo que sale de juntar ingredientes', () => {
    expect(pasilloDe('10 limones')).toBe('frutas');
    expect(pasilloDe('3 pimentones rojos')).toBe('frutas');
    expect(pasilloDe('Cilantro ×3')).toBe('frutas');
    expect(pasilloDe('salmón')).toBe('carnes');
    expect(pasilloDe('Salsa de soya')).toBe('despensa');
  });

  it('agrupa en el orden del súper y sin grupos vacíos', () => {
    const grupos = porPasillo([{ name: 'Arroz blanco' }, { name: '2 tomates' }, { name: '2 filetes de salmón' }, { name: '1 cebolla' }]);
    expect(grupos.map((g) => g.id)).toEqual(['frutas', 'carnes', 'despensa']);
    expect(grupos[0].items.map((x) => x.name)).toEqual(['2 tomates', '1 cebolla']);
  });
});
