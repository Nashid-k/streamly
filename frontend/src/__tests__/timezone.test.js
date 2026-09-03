import { describe, it, expect } from 'vitest';
import { getUserTimezone, formatTMDBDate, getTMDBWeekday, getTimeUntil } from '../utils/timezone';

describe('getUserTimezone', () => {
  it('returns a string timezone', () => {
    const tz = getUserTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('returns a valid IANA timezone or UTC fallback', () => {
    const tz = getUserTimezone();
    // Should be either a valid timezone or 'UTC'
    expect(tz).toMatch(/^[A-Za-z]+\/[A-Za-z_]+|^UTC$/);
  });
});

describe('formatTMDBDate', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatTMDBDate(null)).toBe('');
    expect(formatTMDBDate(undefined)).toBe('');
    expect(formatTMDBDate('')).toBe('');
  });

  it('formats a valid date', () => {
    const result = formatTMDBDate('2026-09-04', { month: 'short', day: 'numeric' });
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns original string on invalid date', () => {
    const result = formatTMDBDate('not-a-date');
    expect(result).toBe('not-a-date');
  });
});

describe('getTMDBWeekday', () => {
  it('returns a weekday name', () => {
    const weekday = getTMDBWeekday('2026-09-04');
    expect(weekday).toBeTruthy();
    expect(typeof weekday).toBe('string');
  });

  it('returns empty string for null', () => {
    expect(getTMDBWeekday(null)).toBe('');
  });
});

describe('getTimeUntil', () => {
  it('returns empty string for null', () => {
    expect(getTimeUntil(null)).toBe('');
  });

  it('returns a meaningful string for a valid date', () => {
    const result = getTimeUntil('2026-09-04');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns "today" for today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = getTimeUntil(today);
    expect(result).toBe('today');
  });

  it('returns "yesterday" for yesterday\'s date', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const result = getTimeUntil(yesterday);
    expect(result).toBe('yesterday');
  });
});
