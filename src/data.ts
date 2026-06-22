/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Habit, DayEvent, Metric, Expense, Goal, StoreCatalogItem } from './types';
import { shift } from './utils';

// Helper list of dates (DATES[0] = today, DATES[1] = yesterday, etc.)
export const DATES: string[] = Array.from({ length: 20 }, (_, i) => shift(-i));

export const INITIAL_HABITS: Habit[] = [];

export const INITIAL_EVENTS: DayEvent[] = [];

export const INITIAL_METRICS: Metric[] = [];

export const INITIAL_STORES: StoreCatalogItem[] = [
  { name: 'Пятёрочка', cat: 'Продукты' },
  { name: 'ВкусВилл', cat: 'Продукты' },
  { name: 'Кофейня', cat: 'Кафе и рестораны' },
  { name: 'Яндекс Такси', cat: 'Транспорт' },
  { name: 'Wildberries', cat: 'Одежда и обувь' },
  { name: 'Аптека Горздрав', cat: 'Здоровье' }
];

export const INITIAL_EXPENSES: Expense[] = [];


export const INITIAL_GOALS: Goal[] = [];

export const GOAL_CATEGORIES: Record<string, { label: string; icon: string; accent: string }> = {
  travel: { label: 'Путешествия', icon: 'compass', accent: '#E5709B' },
  learning: { label: 'Обучение', icon: 'school', accent: '#3B82C4' },
  health: { label: 'Здоровье', icon: 'activity', accent: '#1D9E75' },
  career: { label: 'Карьера', icon: 'briefcase', accent: '#E08A2B' },
  creativity: { label: 'Творчество', icon: 'sparkles', accent: '#7E5BD0' },
  relationships: { label: 'Семья', icon: 'heart', accent: '#6C6BD0' }
};
