import type { PostPlatform, PostStatus } from '@/lib/supabase';

export const PLATFORMS: { key: PostPlatform; label: string; icon: string; color: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
  { key: 'facebook', label: 'Facebook', icon: '👥', color: '#1877F2' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#25F4EE' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  { key: 'x', label: 'X', icon: '𝕏', color: '#7DD3FC' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000' },
  { key: 'otro', label: 'Otro', icon: '📌', color: '#A1A1AA' },
];

export const STATUSES: { key: PostStatus; label: string; icon: string; color: string }[] = [
  { key: 'idea', label: 'Idea', icon: '💡', color: '#F59E0B' },
  { key: 'en_diseno', label: 'En diseño', icon: '🎨', color: '#3B82F6' },
  { key: 'listo', label: 'Listo', icon: '✅', color: '#22C55E' },
  { key: 'publicado', label: 'Publicado', icon: '🚀', color: '#8B5CF6' },
];

export const platformMeta = (key: PostPlatform) =>
  PLATFORMS.find((p) => p.key === key) ?? PLATFORMS[PLATFORMS.length - 1];

export const statusMeta = (key: PostStatus) =>
  STATUSES.find((s) => s.key === key) ?? STATUSES[0];
