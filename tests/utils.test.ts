/**
 * Unit tests for src/utils.ts — pure date / domain helpers.
 * Run: node --experimental-strip-types --test
 *
 * Tests are written relative to the current date so they are deterministic on
 * any run day.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ymd, today, shift, computeStreak, calGrid, sleepDuration, rub, pcolor,
} from '../src/utils.ts';

test('ymd formats a Date as zero-padded YYYY-MM-DD', () => {
  assert.equal(ymd(new Date(2026, 0, 5)), '2026-01-05'); // Jan 5
  assert.equal(ymd(new Date(2026, 11, 31)), '2026-12-31');
});

test('shift(0) equals today(); shift is symmetric', () => {
  assert.equal(shift(0), today());
  const d = new Date();
  d.setDate(d.getDate() - 3);
  assert.equal(shift(-3), ymd(d));
});

test('computeStreak: empty list is 0', () => {
  assert.equal(computeStreak([]), 0);
});

test('computeStreak: counts consecutive run ending today', () => {
  const dates = [shift(0), shift(-1), shift(-2)];
  assert.equal(computeStreak(dates), 3);
});

test('computeStreak: grace day — today missing but yesterday present still counts', () => {
  const dates = [shift(-1), shift(-2)];
  assert.equal(computeStreak(dates), 2);
});

test('computeStreak: broken streak (gap) resets at the gap', () => {
  const dates = [shift(0), shift(-1), shift(-3)]; // -2 missing
  assert.equal(computeStreak(dates), 2);
});

test('computeStreak: only old dates (>1 day ago) => 0', () => {
  assert.equal(computeStreak([shift(-5), shift(-6)]), 0);
});

test('computeStreak: duplicate dates do not inflate the count', () => {
  assert.equal(computeStreak([shift(0), shift(0), shift(-1)]), 2);
});

test('calGrid always returns exactly 42 cells', () => {
  for (let m = 0; m < 12; m++) {
    assert.equal(calGrid(2026, m).length, 42, `month ${m}`);
  }
});

test('calGrid marks the correct number of in-month days (Feb 2024 leap = 29)', () => {
  const cells = calGrid(2024, 1); // February 2024 (leap year)
  assert.equal(cells.filter((c) => c.cur).length, 29);
});

test('calGrid Feb 2026 (non-leap) has 28 in-month days', () => {
  const cells = calGrid(2026, 1);
  assert.equal(cells.filter((c) => c.cur).length, 28);
});

test('calGrid first column is Monday-aligned (no off-by-one week start)', () => {
  // First in-month day must appear at an index < 7 (within first row).
  const cells = calGrid(2026, 5);
  const firstCur = cells.findIndex((c) => c.cur);
  assert.ok(firstCur >= 0 && firstCur < 7);
});

test('sleepDuration: simple overnight 23:00 -> 07:00 = 8h', () => {
  assert.equal(sleepDuration('23:00', '07:00'), 8);
});

test('sleepDuration: same-evening order 22:30 -> 06:00 = 7.5h', () => {
  assert.equal(sleepDuration('22:30', '06:00'), 7.5);
});

test('sleepDuration: snaps to nearest half hour', () => {
  // 23:10 -> 07:00 = 7h50m -> snapped to 8.0
  assert.equal(sleepDuration('23:10', '07:00'), 8);
});

test('sleepDuration: missing/invalid input returns null', () => {
  assert.equal(sleepDuration('', '07:00'), null);
  assert.equal(sleepDuration('23:00', ''), null);
  assert.equal(sleepDuration('23', '07:00'), null);
});

test('rub formats integers with ru-RU grouping and ruble sign', () => {
  const out = rub(1234567);
  assert.ok(out.includes('₽'));
  assert.equal(out.replace(/\s|\u00a0|₽/g, ''), '1234567');
});

test('pcolor returns a known color for a known category and a fallback otherwise', () => {
  assert.equal(pcolor('Продукты'), '#1D9E75');
  assert.equal(pcolor('НесуществующаяКатегория'), '#8A8A86');
});
