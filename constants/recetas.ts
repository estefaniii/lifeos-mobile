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

  // ── Desayunos ──
  {
    id: 'tortilla-maiz', titulo: 'Tortilla de maíz con huevo revuelto', slot: 'desayuno', minutos: 20, porciones: 2,
    foto: require('../assets/images/recetas/tortilla-maiz.jpg'), etiquetas: ['Panameña', 'Proteína'],
    ingredientes: ['1 taza de harina de maíz precocida', '3/4 taza de agua tibia', '1/2 cdta de sal', '3 huevos', '1/2 tomate picado', '1/4 cebolla picada', '60 g de queso blanco', '1 cdta de mantequilla'],
    pasos: [
      'Mezcla la harina, el agua y la sal hasta tener una masa suave. Reposa 5 minutos.',
      'Forma 2 tortillas gruesas y cocínalas en un sartén caliente 5 minutos por lado.',
      'Sofríe la cebolla y el tomate en la mantequilla, agrega los huevos batidos y revuelve hasta que cuajen.',
      'Sirve las tortillas con el huevo y el queso blanco en tajadas.',
    ],
  }, // Pexels 37025260
  {
    id: 'omelette', titulo: 'Omelette de espinaca y hongos', slot: 'desayuno', minutos: 10, porciones: 1,
    foto: require('../assets/images/recetas/omelette.jpg'), etiquetas: ['Rápida', 'Proteína', 'Vegetariana'],
    ingredientes: ['2 huevos', '1 puñado de espinaca', '3 hongos en láminas', '1 cda de leche', '1 cdta de aceite de oliva', 'Sal y pimienta'],
    pasos: [
      'Bate los huevos con la leche, sal y pimienta.',
      'Saltea los hongos en el aceite 3 minutos y suma la espinaca hasta que se marchite.',
      'Vierte los huevos encima, baja el fuego y tapa 3 minutos.',
      'Dobla por la mitad y sirve.',
    ],
  }, // Pexels 37547474
  {
    id: 'overnight-oats', titulo: 'Overnight oats con frutos rojos', slot: 'desayuno', minutos: 5, porciones: 1,
    foto: require('../assets/images/recetas/overnight-oats.jpg'), etiquetas: ['Sin cocinar', 'Para llevar', 'Dulce'],
    ingredientes: ['1/2 taza de avena en hojuelas', '1/2 taza de leche o bebida vegetal', '1/4 taza de yogur griego', '1 cda de semillas de chía', '1 cdta de miel', 'Moras y frambuesas'],
    pasos: [
      'Mezcla la avena, la leche, el yogur, la chía y la miel en un frasco.',
      'Tapa y deja en la nevera toda la noche.',
      'En la mañana, remueve y cubre con las frutas.',
    ],
  }, // Pexels 27850091
  {
    id: 'chia', titulo: 'Chía pudding con mango', slot: 'desayuno', minutos: 5, porciones: 2,
    foto: require('../assets/images/recetas/chia.jpg'), etiquetas: ['Sin cocinar', 'Dulce'],
    ingredientes: ['4 cdas de semillas de chía', '1 taza de leche de coco o de almendra', '1 cdta de miel', '1 mango maduro', '4 fresas', 'Unas gotas de vainilla'],
    pasos: [
      'Mezcla la chía con la leche, la miel y la vainilla.',
      'Remueve otra vez a los 10 minutos para que no se apelmace.',
      'Deja en la nevera mínimo 4 horas o toda la noche.',
      'Sirve en vasos con capas de fresa y mango picado.',
    ],
  }, // Pexels 5150220
  {
    id: 'shakshuka', titulo: 'Huevos en salsa de tomate', slot: 'desayuno', minutos: 25, porciones: 2,
    foto: require('../assets/images/recetas/shakshuka.jpg'), etiquetas: ['Fin de semana', 'Vegetariana'],
    ingredientes: ['4 huevos', '1 lata de tomate triturado', '1 pimentón rojo', '1 cebolla', '2 dientes de ajo', '1 cdta de comino', '1 cda de aceite de oliva', 'Perejil o cilantro'],
    pasos: [
      'Sofríe la cebolla, el pimentón y el ajo en el aceite 5 minutos.',
      'Agrega el tomate, el comino y sal. Cocina 10 minutos a fuego medio.',
      'Haz 4 huecos en la salsa y rompe un huevo en cada uno.',
      'Tapa y cocina 5 a 7 minutos, hasta que la clara cuaje. Termina con perejil.',
    ],
  }, // Pexels 6275160

  // ── Meriendas ──
  {
    id: 'frutas-tropicales', titulo: 'Plato de frutas tropicales', slot: 'merienda', minutos: 10, porciones: 2,
    foto: require('../assets/images/recetas/frutas-tropicales.jpg'), etiquetas: ['Sin cocinar', 'Dulce'],
    ingredientes: ['1/2 papaya', '1 mango', '1/2 pitahaya', '1 limón', '1 cda de coco rallado', 'Hojas de menta'],
    pasos: [
      'Pela y corta la papaya, el mango y la pitahaya en trozos.',
      'Acomódalos en un plato y exprime el limón por encima.',
      'Espolvorea el coco y termina con la menta.',
    ],
  }, // Pexels 10248844
  {
    id: 'hummus', titulo: 'Hummus con palitos de vegetales', slot: 'merienda', minutos: 10, porciones: 4,
    foto: require('../assets/images/recetas/hummus.jpg'), etiquetas: ['Vegetariana', 'Sin cocinar', 'Para llevar'],
    ingredientes: ['1 lata de garbanzos escurridos', '2 cdas de tahini', '1 limón', '1 diente de ajo', '3 cdas de aceite de oliva', '2 zanahorias', '1 pepino', '1 pimentón'],
    pasos: [
      'Licúa los garbanzos, el tahini, el jugo del limón, el ajo y sal.',
      'Agrega el aceite y 2 a 4 cdas de agua fría hasta que quede cremoso.',
      'Corta la zanahoria, el pepino y el pimentón en palitos.',
      'Sirve el hummus con un hilo de aceite y los vegetales al lado.',
    ],
  }, // Pexels 34644302
  {
    id: 'galletas-avena', titulo: 'Galletas de avena y plátano', slot: 'merienda', minutos: 25, porciones: 12,
    foto: require('../assets/images/recetas/galletas-avena.jpg'), etiquetas: ['Dulce', 'Rinde para la semana'],
    ingredientes: ['2 plátanos maduros', '1 1/2 taza de avena en hojuelas', '1/4 taza de pasas o chispas de chocolate', '1 cdta de canela', '1 cda de aceite de coco', 'Una pizca de sal'],
    pasos: [
      'Calienta el horno a 180 °C y forra una bandeja con papel.',
      'Aplasta los plátanos con un tenedor y mezcla con el resto de ingredientes.',
      'Forma 12 bolitas, ponlas en la bandeja y aplánalas un poco.',
      'Hornea 15 minutos, hasta que doren. Deja enfriar antes de despegarlas.',
    ],
  }, // Pexels 15265270
  {
    id: 'bolitas', titulo: 'Bolitas de dátil y almendra', slot: 'merienda', minutos: 15, porciones: 12,
    foto: require('../assets/images/recetas/bolitas.jpg'), etiquetas: ['Sin cocinar', 'Dulce', 'Para llevar'],
    ingredientes: ['1 taza de dátiles sin semilla', '1 taza de almendras', '2 cdas de cacao en polvo', '1 cda de mantequilla de maní', 'Una pizca de sal'],
    pasos: [
      'Si los dátiles están secos, remójalos 10 minutos en agua tibia y escúrrelos.',
      'Procesa las almendras hasta que queden en trozos pequeños.',
      'Agrega los dátiles, el cacao, la mantequilla de maní y la sal, y procesa hasta formar una masa.',
      'Forma 12 bolitas y guárdalas en la nevera hasta una semana.',
    ],
  }, // Pexels 28354485
  {
    id: 'tajadas', titulo: 'Tajadas de plátano maduro', slot: 'merienda', minutos: 15, porciones: 2,
    foto: require('../assets/images/recetas/tajadas.jpg'), etiquetas: ['Panameña', 'Dulce'],
    ingredientes: ['2 plátanos bien maduros (cáscara negra)', '1 cda de aceite', 'Una pizca de sal', '60 g de queso blanco (opcional)'],
    pasos: [
      'Pela los plátanos y córtalos en tajadas largas y diagonales.',
      'Calienta el aceite en un sartén antiadherente a fuego medio.',
      'Dora las tajadas 3 a 4 minutos por lado, hasta que caramelicen.',
      'Escurre en papel, ponles sal y sírvelas con queso blanco si quieres.',
    ],
  }, // Pexels 27556971

  // ── Almuerzos ──
  {
    id: 'sancocho', titulo: 'Sancocho panameño', slot: 'almuerzo', minutos: 75, porciones: 6,
    foto: require('../assets/images/recetas/sancocho.jpg'), etiquetas: ['Panameña', 'Reconfortante', 'Fin de semana'],
    ingredientes: ['1 pollo de patio o 1 kg de presas', '1 kg de ñame', '2 mazorcas de maíz', '1 cebolla', '3 dientes de ajo', '1 manojo de culantro', '1 cdta de orégano', 'Sal', 'Arroz blanco para acompañar'],
    pasos: [
      'Sazona el pollo con ajo, orégano, sal y la mitad del culantro picado.',
      'Ponlo en una olla con la cebolla y 3 litros de agua. Hierve 30 minutos.',
      'Agrega el maíz en trozos y el ñame pelado en cubos. Cocina 30 minutos más.',
      'Aplasta algunos trozos de ñame contra la olla para espesar el caldo.',
      'Termina con el resto del culantro y sirve con arroz blanco.',
    ],
  }, // Pexels 29538429
  {
    id: 'arroz-pollo', titulo: 'Arroz con pollo', slot: 'almuerzo', minutos: 45, porciones: 4,
    foto: require('../assets/images/recetas/arroz-pollo.jpg'), etiquetas: ['Panameña', 'Rinde para la semana'],
    ingredientes: ['2 tazas de arroz', '500 g de muslos de pollo sin hueso', '1 pimentón rojo', '1 cebolla', '2 dientes de ajo', '1/2 taza de guisantes', '1 cdta de achiote o cúrcuma', '4 tazas de caldo de pollo', 'Culantro'],
    pasos: [
      'Corta el pollo en trozos, sazónalo con sal y ajo, y dóralo en una olla con un poco de aceite.',
      'Agrega la cebolla y el pimentón picados y sofríe 5 minutos.',
      'Suma el arroz y el achiote, y remueve 1 minuto.',
      'Vierte el caldo caliente, tapa y cocina a fuego bajo 20 minutos.',
      'Agrega los guisantes y el culantro, y deja reposar tapado 5 minutos.',
    ],
  }, // Pexels 21821579
  {
    id: 'tacos-pescado', titulo: 'Tacos de pescado', slot: 'almuerzo', minutos: 25, porciones: 2,
    foto: require('../assets/images/recetas/tacos-pescado.jpg'), etiquetas: ['Proteína', 'Rápida'],
    ingredientes: ['300 g de filete de pescado blanco', '6 tortillas de maíz', '1 taza de repollo rallado', '1/2 cebolla morada', '2 limones', '3 cdas de yogur griego', '1 cdta de pimentón dulce', 'Cilantro'],
    pasos: [
      'Sazona el pescado con pimentón, sal y jugo de medio limón.',
      'Cocínalo en un sartén con poco aceite, 3 minutos por lado, y desmenúzalo.',
      'Mezcla el yogur con jugo de limón y sal para la salsa.',
      'Calienta las tortillas y rellénalas con repollo, pescado, cebolla, salsa y cilantro.',
    ],
  }, // Pexels 9044685

  // ── Cenas ──
  {
    id: 'ceviche', titulo: 'Ceviche de corvina', slot: 'cena', minutos: 20, porciones: 4,
    foto: require('../assets/images/recetas/ceviche.jpg'), etiquetas: ['Panameña', 'Sin cocinar', 'Proteína'],
    ingredientes: ['500 g de filete de corvina fresca', '10 limones', '1 cebolla morada', '1 ají chombo', '1 tallo de apio', 'Culantro picado', 'Sal'],
    pasos: [
      'Corta la corvina en cubos pequeños y ponla en un recipiente de vidrio.',
      'Agrega la cebolla en pluma, el apio picado, el ají chombo sin semillas picado muy fino y sal.',
      'Cubre con el jugo de limón y remueve.',
      'Tapa y deja en la nevera al menos 2 horas.',
      'Termina con culantro y sirve frío con galletas o plátano.',
    ],
  }, // Pexels 26586571
  {
    id: 'curry-garbanzos', titulo: 'Curry de garbanzos con arroz', slot: 'cena', minutos: 30, porciones: 4,
    foto: require('../assets/images/recetas/curry-garbanzos.jpg'), etiquetas: ['Vegetariana', 'Rinde para la semana'],
    ingredientes: ['2 latas de garbanzos escurridos', '1 lata de leche de coco', '1 lata de tomate triturado', '1 cebolla', '2 dientes de ajo', '1 cda de jengibre rallado', '2 cdas de curry en polvo', 'Cilantro', 'Arroz blanco'],
    pasos: [
      'Sofríe la cebolla, el ajo y el jengibre en un poco de aceite 5 minutos.',
      'Agrega el curry y remueve 1 minuto, hasta que suelte el aroma.',
      'Suma el tomate, la leche de coco y los garbanzos. Cocina 15 minutos a fuego bajo.',
      'Ajusta la sal y sirve con arroz y cilantro.',
    ],
  }, // Pexels 6544375
  {
    id: 'teriyaki', titulo: 'Pollo teriyaki con arroz', slot: 'cena', minutos: 25, porciones: 2,
    foto: require('../assets/images/recetas/teriyaki.jpg'), etiquetas: ['Proteína', 'Rápida'],
    ingredientes: ['2 muslos de pollo sin hueso', '3 cdas de salsa de soya', '1 cda de miel', '1 cda de vinagre de arroz', '1 diente de ajo rallado', '1 cdta de jengibre rallado', '1 cdta de maicena', 'Ajonjolí y cebollina', 'Arroz blanco'],
    pasos: [
      'Mezcla la soya, la miel, el vinagre, el ajo, el jengibre y la maicena con 3 cdas de agua.',
      'Dora el pollo en un sartén 5 minutos por lado, hasta que esté cocido.',
      'Vierte la salsa y cocina 2 minutos, volteando el pollo hasta que quede brillante.',
      'Corta en tiras y sirve sobre el arroz con ajonjolí y cebollina.',
    ],
  }, // Pexels 35064952
  {
    id: 'crema-auyama', titulo: 'Crema de auyama', slot: 'cena', minutos: 35, porciones: 4,
    foto: require('../assets/images/recetas/crema-auyama.jpg'), etiquetas: ['Vegetariana', 'Reconfortante'],
    ingredientes: ['1 kg de auyama', '1 cebolla', '2 dientes de ajo', '1 zanahoria', '4 tazas de caldo de vegetales', '1/2 taza de leche de coco', 'Sal y pimienta', 'Semillas de auyama tostadas'],
    pasos: [
      'Pela la auyama y córtala en cubos, junto con la zanahoria.',
      'Sofríe la cebolla y el ajo en un poco de aceite 3 minutos.',
      'Agrega la auyama, la zanahoria y el caldo. Cocina 20 minutos, hasta que estén blandas.',
      'Licúa con la leche de coco hasta que quede lisa y ajusta la sal.',
      'Sirve con las semillas por encima.',
    ],
  }, // Pexels 5662190
  {
    id: 'fajitas', titulo: 'Fajitas de pollo con pimentón', slot: 'cena', minutos: 25, porciones: 3,
    foto: require('../assets/images/recetas/fajitas.jpg'), etiquetas: ['Proteína', 'Una sola bandeja'],
    ingredientes: ['2 pechugas de pollo', '1 pimentón rojo', '1 pimentón verde', '1 cebolla', '1 cdta de comino', '1 cdta de pimentón dulce', '1 limón', '6 tortillas de trigo', '1 aguacate'],
    pasos: [
      'Sazona las pechugas con comino, pimentón dulce, sal y el jugo del limón.',
      'Ásalas en un sartén caliente 6 minutos por lado y córtalas en tiras.',
      'En el mismo sartén, saltea los pimentones y la cebolla en tiras 5 minutos.',
      'Junta el pollo con los vegetales y sirve con tortillas calientes y aguacate.',
    ],
  }, // Pexels 32371267
];
