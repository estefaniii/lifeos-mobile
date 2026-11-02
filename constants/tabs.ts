// Las pestañas del menú inferior, con su color y su icono. Una ruta que no está
// aquí no sale en el menú (se llega a ella desde otra pantalla).
export const TAB_COLOR: Record<string, { color: string; icon: any }> = {
  index: { color: '#FFB547', icon: 'house.fill' },
  exercise: { color: '#FF7A6B', icon: 'figure.run' },
  food: { color: '#B6E36B', icon: 'fork.knife' },
  hobbies: { color: '#F49AC1', icon: 'paintpalette.fill' },
  finances: { color: '#5FD3A8', icon: 'dollarsign.circle.fill' },
  notes: { color: '#8FB8FF', icon: 'doc.text.fill' },
};
