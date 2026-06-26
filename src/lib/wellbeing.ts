/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Well-being domain logic (pure, unit-tested).
 * Kept separate from the view so it can be reasoned about and tested without
 * a browser. No medical claims, no negative-trend amplification — insights are
 * neutral, factual nudges built from data the user already logged.
 */

import type { Metric } from '../types';
import { computeStreak, today, shift } from '../utils.ts';

/** Dates on which the user logged ANY well-being signal (mood / water / sleep). */
export function loggedDates(metrics: Metric[]): string[] {
  if (!Array.isArray(metrics)) return [];
  return metrics
    .filter(
      (m) =>
        m &&
        (!!m.mood ||
          (typeof m.water === 'number' && m.water > 0) ||
          typeof m.sleep === 'number'),
    )
    .map((m) => m.date);
}

/** Consecutive-day streak of well-being logging, ending today (with a grace day). */
export function computeWellbeingStreak(metrics: Metric[]): number {
  return computeStreak(loggedDates(metrics));
}

export interface Insight {
  emoji: string;
  text: string;
}

/**
 * Up to two short, neutral insights derived from existing metrics.
 * Deterministic and defensive: returns [] when there isn't enough data.
 */
export function computeInsights(metrics: Metric[], language = 'ru'): Insight[] {
  if (!Array.isArray(metrics)) return [];
  const en = language === 'en';
  const out: Insight[] = [];
  const byDate = new Map(metrics.map((m) => [m.date, m]));
  const t = byDate.get(today());
  const y = byDate.get(shift(-1));

  // 1) Hydration vs yesterday (only when both days have water logged).
  if (
    t && y &&
    typeof t.water === 'number' &&
    typeof y.water === 'number' &&
    y.water > 0
  ) {
    if (t.water >= y.water) {
      out.push({ emoji: '💧', text: en ? 'More water than yesterday' : 'Воды больше, чем вчера' });
    } else {
      const pct = Math.round(((y.water - t.water) / y.water) * 100);
      out.push({
        emoji: '💧',
        text: en ? `${pct}% less water than yesterday` : `Воды на ${pct}% меньше, чем вчера`,
      });
    }
  }

  // 2) Average sleep over the last few logged nights.
  const sleeps = metrics
    .filter((m) => typeof m.sleep === 'number')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((m) => m.sleep as number);
  if (sleeps.length >= 3) {
    const avg = sleeps.reduce((s, x) => s + x, 0) / sleeps.length;
    out.push({
      emoji: '😴',
      text: en
        ? `Avg sleep (last ${sleeps.length}): ${avg.toFixed(1)} h`
        : `Средний сон за ${sleeps.length} дн.: ${avg.toFixed(1)} ч`,
    });
  }

  // 3) Good-mood days this week (a gentle positive).
  const week = new Set<string>();
  for (let i = 0; i < 7; i++) week.add(shift(-i));
  const good = metrics.filter(
    (m) => week.has(m.date) && (m.mood === 'good' || m.mood === 'great'),
  ).length;
  if (good > 0) {
    out.push({
      emoji: '🙂',
      text: en ? `${good}/7 good-mood days this week` : `Хорошее настроение: ${good} из 7 дней`,
    });
  }

  return out.slice(0, 2);
}
