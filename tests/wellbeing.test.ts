/**
 * Unit tests for src/lib/wellbeing.ts.
 * Run: node --experimental-strip-types --test
 * Date-relative so they're deterministic on any run day.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { today, shift } from '../src/utils.ts';
import {
  loggedDates,
  computeWellbeingStreak,
  computeInsights,
} from '../src/lib/wellbeing.ts';

test('loggedDates picks days with any well-being signal', () => {
  const m = [
    { date: today(), water: 500 },
    { date: shift(-1), mood: 'good' as const },
    { date: shift(-2), sleep: 7 },
    { date: shift(-3) }, // nothing logged -> excluded
    { date: shift(-4), water: 0 }, // zero water -> excluded
  ];
  assert.deepEqual(loggedDates(m).sort(), [today(), shift(-1), shift(-2)].sort());
});

test('computeWellbeingStreak counts consecutive logged days', () => {
  const m = [
    { date: today(), water: 300 },
    { date: shift(-1), mood: 'great' as const },
    { date: shift(-2), sleep: 8 },
  ];
  assert.equal(computeWellbeingStreak(m), 3);
});

test('computeWellbeingStreak is 0 for empty / invalid input', () => {
  assert.equal(computeWellbeingStreak([]), 0);
  assert.equal(computeWellbeingStreak(null), 0);
});

test('insights: more water than yesterday', () => {
  const m = [
    { date: today(), water: 1500 },
    { date: shift(-1), water: 1000 },
  ];
  const ins = computeInsights(m, 'en');
  assert.ok(ins.some((i) => i.text.includes('More water')));
});

test('insights: less water than yesterday shows a percentage', () => {
  const m = [
    { date: today(), water: 800 },
    { date: shift(-1), water: 1000 },
  ];
  const ins = computeInsights(m, 'en');
  assert.ok(ins.some((i) => i.text.includes('20% less water')));
});

test('insights: average sleep needs >=3 nights', () => {
  const two = [
    { date: shift(-1), sleep: 7 },
    { date: shift(-2), sleep: 8 },
  ];
  assert.ok(!computeInsights(two, 'en').some((i) => i.text.includes('Avg sleep')));

  const three = [...two, { date: shift(-3), sleep: 6 }];
  assert.ok(computeInsights(three, 'en').some((i) => i.text.includes('Avg sleep')));
});

test('insights: returns at most two items and never throws on junk', () => {
  assert.deepEqual(computeInsights(null), []);
  const many = [
    { date: today(), water: 2000, mood: 'great' as const },
    { date: shift(-1), water: 1000, sleep: 7 },
    { date: shift(-2), sleep: 8 },
    { date: shift(-3), sleep: 6 },
  ];
  assert.ok(computeInsights(many, 'ru').length <= 2);
});
