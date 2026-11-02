// Tipos de hobby (los mismos que tenía Luni) y estados de una obra.
import type { EstadoObra } from '@/hooks/use-hobbies';

export const TIPOS_HOBBY = [
  { kind: 'tejido', nombre: 'Tejido', emoji: '🧶', color: '#F49AC1' },
  { kind: 'dibujo', nombre: 'Dibujo', emoji: '✏️', color: '#FFB547' },
  { kind: 'pintura', nombre: 'Pintura', emoji: '🎨', color: '#FF7A6B' },
  { kind: 'guitarra', nombre: 'Guitarra', emoji: '🎸', color: '#B6E36B' },
  { kind: 'ukelele', nombre: 'Ukelele', emoji: '🪕', color: '#5FD3A8' },
  { kind: 'canto', nombre: 'Canto', emoji: '🎤', color: '#8FB8FF' },
  { kind: 'composicion', nombre: 'Composición', emoji: '🎼', color: '#C9A7FF' },
  { kind: 'escritura', nombre: 'Escritura', emoji: '📝', color: '#FFD86B' },
  { kind: 'lectura', nombre: 'Lectura', emoji: '📚', color: '#7CC4FF' },
  { kind: 'otro', nombre: 'Otro', emoji: '✨', color: '#EADBC8' },
] as const;

export const ESTADOS_OBRA: { estado: EstadoObra; nombre: string; color: string }[] = [
  { estado: 'idea', nombre: 'Idea', color: '#C4B8AB' },
  { estado: 'en_proceso', nombre: 'En proceso', color: '#FFB547' },
  { estado: 'pausada', nombre: 'Pausada', color: '#8FB8FF' },
  { estado: 'terminada', nombre: 'Terminada', color: '#5FD3A8' },
  { estado: 'regalada', nombre: 'Regalada', color: '#F49AC1' },
  { estado: 'vendida', nombre: 'Vendida', color: '#B6E36B' },
];
export const estadoObra = (e: EstadoObra) => ESTADOS_OBRA.find((x) => x.estado === e) ?? ESTADOS_OBRA[1];

export const MINUTOS_RAPIDOS = [15, 30, 45, 60, 90];
