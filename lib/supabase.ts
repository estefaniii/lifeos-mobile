import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Tipos de datos para LifeOS
 */

export interface User {
  id: string;
  telegram_id?: number;
  name?: string;
  email?: string;
  created_at: string;
  last_active?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  source?: string;
  date: string;
  note?: string;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  sleep_minutes: number;
  sleep_bedtime?: string;
  sleep_waketime?: string;
  sleep_quality?: number;
  exercise_minutes: number;
  water_ml: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals_tracked: boolean;
  gym_session: boolean;
  yoga_session: boolean;
  massage_session: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: string;
}

export interface ProductivityLog {
  id: string;
  user_id: string;
  project_id: string;
  duration_minutes: number;
  date: string;
  note?: string;
}

export interface MentalLog {
  id: string;
  user_id: string;
  stress_level?: number;
  meditation_minutes: number;
  date: string;
  note?: string;
}

export interface Affirmation {
  id: string;
  user_id: string;
  text: string;
  date: string;
  is_active: boolean;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  text: string;
  sender: 'user' | 'ai';
  created_at: string;
}
