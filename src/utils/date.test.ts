import { describe, expect, it } from 'vitest';

import { formatDate, isSameDay } from './date.ts';

describe('date utilities', () => {
  it('formats a date into a readable month day year string', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024');
  });

  it('detects whether two dates fall on the same calendar day', () => {
    expect(isSameDay(new Date('2024-01-15T08:00:00Z'), new Date('2024-01-15T20:00:00Z'))).toBe(true);
    expect(isSameDay(new Date('2024-01-15T00:00:00Z'), new Date('2024-01-16T00:00:00Z'))).toBe(false);
  });
});
