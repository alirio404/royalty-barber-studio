import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimeToMinutes, overlaps, slotIsWithinHours } from '../lib/domain.mjs';

test('parses 24-hour schedule times', () => {
  assert.equal(parseTimeToMinutes('10:00'), 600);
  assert.equal(parseTimeToMinutes('20:15:00'), 1215);
  assert.throws(() => parseTimeToMinutes('25:10'), /Hora no válida/);
});

test('detects overlapping appointment intervals using half-open boundaries', () => {
  assert.equal(overlaps(600, 645, 630, 675), true);
  assert.equal(overlaps(600, 645, 645, 690), false);
  assert.equal(overlaps(600, 600, 610, 620), true);
});

test('does not offer service slots outside opening hours', () => {
  assert.equal(slotIsWithinHours(600, 45, '10:00', '20:00'), true);
  assert.equal(slotIsWithinHours(1170, 45, '10:00', '20:00'), false);
  assert.equal(slotIsWithinHours(600, 0, '10:00', '20:00'), false);
});
