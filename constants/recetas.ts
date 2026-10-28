// Recetas sencillas para el plan de comidas. Las fotos son de Pexels (licencia libre) y viajan
// dentro de la app en assets/images/recetas, así que no dependen de ningún enlace externo.
import type { ImageSourcePropType } from 'react-native';
import type { Slot } from './comida';

export type Receta = {
  id: string;
  titulo: string;
  slot: Slot;
  minutos: number;
  porciones: number;
  foto: ImageSourcePropType;
  etiquetas: string[];
  ingredientes: string[];
  pasos: string[];
};

export const RECETAS: Receta[] = [
  {
    id: 'avena', titulo: 'Avena cremosa con frutos rojos', slot: 'desayuno', minutos: 10, porciones: 1,
    foto: require('../assets/images/recetas/avena.jpg'), etiquetas: ['Rápida', 'Dulce'],
    ingredientes: ['1/2 taza de avena en hojuelas', '1 taza de leche o bebida vegetal', '1/2 plátano', 'Fresas y arándanos', '1 cdta de miel', 'Canela'],
    pasos: [
      'Pon la avena y la leche en una olla a fuego medio.',
      'Remueve 5 minutos, hasta que espese. Agrega una pizca de canela.',
      'Sirve y cubre con el plátano en rodajas, las fresas y los arándanos.',
      'Termina con un hilo de miel.',
    ],
  },
  {
    id: 'tostada', titulo: 'Tostada de aguacate con huevo', slot: 'desayuno', minutos: 10, porciones: 1,
    foto: require('../assets/images/recetas/tostada.jpg'), etiquetas: ['Rápida', 'Proteína'],
    ingredientes: ['1 rebanada de pan integral', '1/2 aguacate', '1 huevo', 'Jugo de limón', 'Sal y pimienta', 'Eneldo o cilantro'],
    pasos: [
      'Tuesta el pan.',
      'Aplasta el aguacate con limón, sal y pimienta, y úntalo sobre el pan.',
      'Cocina el huevo frito o poché, con la yema blanda.',
      'Ponlo encima y termina con las hierbas.',
    ],
  },
  {
    id: 'pancakes', titulo: 'Pancakes de avena y plátano', slot: 'desayuno', minutos: 20, porciones: 2,
    foto: require('../assets/images/recetas/pancakes.jpg'), etiquetas: ['Fin de semana', 'Dulce'],
    ingredientes: ['1 plátano maduro', '2 huevos', '1/2 taza de avena', '1 cdta de polvo de hornear', 'Canela', 'Miel para servir'],
    pasos: [
      'Licúa el plátano, los huevos, la avena, el polvo de hornear y la canela.',
      'Deja reposar la mezcla 5 minutos.',
      'En un sartén antiadherente a fuego medio-bajo, vierte porciones pequeñas.',
      'Voltea cuando salgan burbujas, a los 2 minutos. Sirve con miel y plátano.',
    ],
  },
  {
    id: 'smoothie', titulo: 'Batido verde', slot: 'merienda', minutos: 5, porciones: 1,
    foto: require('../assets/images/recetas/smoothie.jpg'), etiquetas: ['Rápida', 'Sin cocinar'],
    ingredientes: ['1 puñado de espinaca', '1/2 pepino', '1 plátano congelado', '1/2 manzana verde', '1 taza de agua o leche vegetal', '1 cda de semillas de chía'],
    pasos: [
      'Pon todo en la licuadora, primero el líquido.',
      'Licúa 1 minuto, hasta que quede liso.',
      'Si lo quieres más frío, agrega hielo y licúa otra vez.',
    ],
  },
  {
    id: 'yogur', titulo: 'Yogur griego con granola', slot: 'merienda', minutos: 3, porciones: 1,
    foto: require('../assets/images/recetas/yogur.jpg'), etiquetas: ['Rápida', 'Sin cocinar', 'Proteína'],
    ingredientes: ['1 taza de yogur griego natural', '3 cdas de granola', 'Arándanos y moras', '1 cdta de miel'],
    pasos: [
      'Sirve el yogur en un bol.',
      'Agrega la granola justo antes de comer, para que siga crujiente.',
      'Termina con las frutas y la miel.',
    ],
  },
  {
    id: 'quinoa', titulo: 'Bowl de quinoa con vegetales asados', slot: 'almuerzo', minutos: 35, porciones: 2,
    foto: require('../assets/images/recetas/quinoa.jpg'), etiquetas: ['Vegetariana', 'Para llevar'],
    ingredientes: ['1 taza de quinoa', '1 pimentón rojo', '200 g de hongos', '1/2 cebolla morada', 'Queso feta', 'Aceite de oliva', 'Sal, pimienta y comino'],
    pasos: [
      'Lava la quinoa y cocínala en 2 tazas de agua con sal, 15 minutos tapada.',
      'Corta el pimentón y los hongos. Mézclalos con aceite, sal y comino.',
      'Ásalos en el horno a 200 °C por 20 minutos.',
      'Arma el bowl con la quinoa, los vegetales, la cebolla en láminas finas y el feta.',
    ],
  },
  {
    id: 'ensalada', titulo: 'Ensalada tibia de pollo y espinaca', slot: 'almuerzo', minutos: 20, porciones: 2,
    foto: require('../assets/images/recetas/ensalada.jpg'), etiquetas: ['Proteína', 'Para llevar'],
    ingredientes: ['2 pechugas de pollo', '2 puñados de espinaca', 'Hummus', 'Pimentón en polvo', 'Ajo en polvo', 'Aceite de oliva', 'Limón'],
    pasos: [
      'Corta el pollo en cubos y sazónalo con pimentón, ajo, sal y aceite.',
      'Dóralo en un sartén caliente 8 a 10 minutos, hasta que esté cocido por dentro.',
      'Unta el hummus en la base del plato y pon la espinaca encima.',
      'Agrega el pollo caliente y un chorrito de limón.',
    ],
  },
  {
    id: 'lentejas', titulo: 'Lentejas guisadas', slot: 'almuerzo', minutos: 40, porciones: 4,
    foto: require('../assets/images/recetas/lentejas.jpg'), etiquetas: ['Vegetariana', 'Rinde para la semana'],
    ingredientes: ['1 1/2 taza de lentejas', '1 cebolla', '2 dientes de ajo', '1 zanahoria', '1 tomate', '1 pimentón', 'Comino y laurel', 'Cilantro'],
    pasos: [
      'Sofríe la cebolla, el ajo, el pimentón y el tomate picados, 5 minutos.',
      'Agrega las lentejas lavadas, la zanahoria en cubos, el comino, el laurel y 4 tazas de agua.',
      'Cocina a fuego medio 30 minutos, hasta que estén suaves. Ajusta la sal.',
      'Sirve con arroz y cilantro picado.',
    ],
  },
  {
    id: 'wrap', titulo: 'Wrap de atún', slot: 'almuerzo', minutos: 10, porciones: 1,
    foto: require('../assets/images/recetas/wrap.jpg'), etiquetas: ['Rápida', 'Para llevar', 'Proteína'],
    ingredientes: ['1 tortilla integral grande', '1 lata de atún en agua', '1 cda de yogur griego', '1/2 zanahoria rallada', 'Pepinillos', 'Espinaca'],
    pasos: [
      'Escurre el atún y mézclalo con el yogur, la zanahoria, sal y pimienta.',
      'Calienta la tortilla 30 segundos en un sartén.',
      'Pon la espinaca, el atún y los pepinillos en el centro.',
      'Dobla los lados y enrolla firme. Córtalo a la mitad.',
    ],
  },
  {
    id: 'salmon', titulo: 'Salmón al horno con vegetales', slot: 'cena', minutos: 25, porciones: 2,
    foto: require('../assets/images/recetas/salmon.jpg'), etiquetas: ['Proteína', 'Una sola bandeja'],
    ingredientes: ['2 filetes de salmón', '1 calabacín', 'Tomates cherry', '1 pimentón', 'Aceite de oliva', 'Limón', 'Sal, pimienta y eneldo'],
    pasos: [
      'Precalienta el horno a 200 °C.',
      'Corta los vegetales, mézclalos con aceite y sal y ponlos en la bandeja.',
      'Hornea 10 minutos. Agrega el salmón sazonado con limón, sal y eneldo.',
      'Hornea 12 minutos más, hasta que el salmón se separe fácil con un tenedor.',
    ],
  },
  {
    id: 'pollo', titulo: 'Pollo al horno con limón y hierbas', slot: 'cena', minutos: 50, porciones: 4,
    foto: require('../assets/images/recetas/pollo.jpg'), etiquetas: ['Rinde para la semana', 'Una sola bandeja'],
    ingredientes: ['4 muslos o presas de pollo', '1 limón', '3 dientes de ajo', 'Romero y tomillo', '300 g de vainitas', '2 papas o camotes', 'Aceite de oliva'],
    pasos: [
      'Precalienta el horno a 200 °C.',
      'Frota el pollo con ajo machacado, ralladura y jugo de limón, hierbas, sal y aceite.',
      'Ponlo en la bandeja con las papas en trozos y hornea 35 minutos.',
      'Agrega las vainitas y hornea 10 minutos más, hasta que el pollo esté dorado.',
    ],
  },
  {
    id: 'sopa', titulo: 'Sopa de pollo con verduras', slot: 'cena', minutos: 45, porciones: 4,
    foto: require('../assets/images/recetas/sopa.jpg'), etiquetas: ['Reconfortante', 'Rinde para la semana'],
    ingredientes: ['2 pechugas de pollo', '2 mazorcas de maíz', '2 zanahorias', '1 calabacín', '1 cebolla', '2 dientes de ajo', 'Cilantro o culantro'],
    pasos: [
      'Hierve el pollo con la cebolla, el ajo y sal en 2 litros de agua, 20 minutos.',
      'Saca el pollo y desmenúzalo.',
      'Agrega al caldo el maíz en trozos y la zanahoria. Cocina 15 minutos.',
      'Suma el calabacín y el pollo, cocina 5 minutos más y termina con cilantro.',
    ],
  },
  {
    id: 'pesto', titulo: 'Pasta integral al pesto', slot: 'cena', minutos: 20, porciones: 2,
    foto: require('../assets/images/recetas/pesto.jpg'), etiquetas: ['Rápida', 'Vegetariana'],
    ingredientes: ['200 g de pasta integral', '1 taza de albahaca', '2 cdas de queso parmesano', '2 cdas de nueces o almendras', '1 diente de ajo', '1/4 taza de aceite de oliva'],
    pasos: [
      'Cocina la pasta en agua con sal según el paquete. Guarda media taza del agua.',
      'Licúa la albahaca, el queso, las nueces, el ajo y el aceite hasta tener una pasta.',
      'Mezcla la pasta escurrida con el pesto y un poco del agua reservada.',
      'Si quieres más proteína, agrégale atún o pollo.',
    ],
  },
];
