/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Habit {
  id: string;
  name: string;
  category: 'health' | 'mind' | 'work' | 'study' | 'custom';
  time: string;
  color: string;
  completedDates: string[]; // List of 'YYYY-MM-DD' strings
}

export interface DayEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  start: string; // 'HH:MM'
  end: string;   // 'HH:MM'
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'health' | 'mind' | 'work' | 'study';
  done: boolean;
  notes?: string;
}

export interface Metric {
  date: string; // 'YYYY-MM-DD'
  weight?: number;
  water?: number;
  mood?: 'awful' | 'bad' | 'neutral' | 'good' | 'great';
  sleep?: number;
  bed?: string; // 'HH:MM'
  wake?: string; // 'HH:MM'
  notes?: string; // optional free-text note about the day
}

export interface Expense {
  id: string;
  store: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  cat: string;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  desc: string;
  cat: 'travel' | 'learning' | 'health' | 'career' | 'creativity' | 'relationships';
  target: string; // 'YYYY-MM-DD'
  status: 'active' | 'completed';
  progress: number; // 0-100
}

export interface StoreCatalogItem {
  name: string;
  cat: string;
}

export interface SyncConfig {
  connected: boolean;
  last: string | null;
  logs: string[];
}
