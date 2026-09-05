import { describe, it, expect } from 'vitest';
import {
  buildWeeklyCalendar,
  getWeekDays,
  getCountdown,
  getCountdownUrgency,
  detectNewReleasesThisWeek,
  detectLeavingSoon,
} from '../utils/releaseCalendar';

describe('buildWeeklyCalendar', () => {
  it('returns calendar with all 7 days', () => {
    const calendar = buildWeeklyCalendar([]);
    expect(Object.keys(calendar)).toHaveLength(7);
    expect(calendar).toHaveProperty('Monday');
    expect(calendar).toHaveProperty('Sunday');
  });

  it('returns empty arrays for items with no releaseDate', () => {
    const calendar = buildWeeklyCalendar([{ id: '1', title: 'No Date' }]);
    const totalItems = Object.values(calendar).flat();
    expect(totalItems).toHaveLength(0);
  });

  it('places items on correct day', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const calendar = buildWeeklyCalendar([{ id: '1', title: 'Test', releaseDate: todayStr }]);
    // Item should appear on exactly one day
    const totalItems = Object.values(calendar).flat();
    expect(totalItems.length).toBe(1);
    expect(totalItems[0].title).toBe('Test');
  });

  it('handles null/undefined items', () => {
    const calendar = buildWeeklyCalendar(null);
    expect(Object.keys(calendar)).toHaveLength(7);
  });
});

describe('getWeekDays', () => {
  it('returns 7 days', () => {
    const days = getWeekDays();
    expect(days).toHaveLength(7);
  });

  it('each day has required fields', () => {
    const days = getWeekDays();
    days.forEach(d => {
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('fullName');
      expect(d).toHaveProperty('date');
      expect(d).toHaveProperty('isToday');
      expect(d).toHaveProperty('fullDate');
    });
  });

  it('exactly one day is today', () => {
    const days = getWeekDays();
    const todayCount = days.filter(d => d.isToday).length;
    expect(todayCount).toBe(1);
  });
});

describe('getCountdown', () => {
  it('returns empty for null date', () => {
    const result = getCountdown(null);
    expect(result.text).toBe('');
    expect(result.isReleased).toBe(true);
  });

  it('returns "Available Now" for past dates', () => {
    const result = getCountdown('2020-01-01');
    expect(result.text).toBe('Available Now');
    expect(result.isReleased).toBe(true);
  });

  it('returns meaningful text for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const dateStr = future.toISOString().split('T')[0];
    const result = getCountdown(dateStr);
    expect(result.text).toBeTruthy();
    expect(result.isReleased).toBe(false);
  });

  it('returns countdown text for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const result = getCountdown(dateStr);
    expect(result.text).toBeTruthy();
    expect(result.isReleased).toBe(false);
    expect(result.days).toBeGreaterThanOrEqual(0);
  });
});

describe('getCountdownUrgency', () => {
  it('returns "released" for 0 or negative', () => {
    expect(getCountdownUrgency(0)).toBe('released');
    expect(getCountdownUrgency(-5)).toBe('released');
  });

  it('returns "imminent" for 1 day', () => {
    expect(getCountdownUrgency(1)).toBe('imminent');
  });

  it('returns "soon" for 2-3 days', () => {
    expect(getCountdownUrgency(2)).toBe('soon');
    expect(getCountdownUrgency(3)).toBe('soon');
  });

  it('returns "upcoming" for 4-7 days', () => {
    expect(getCountdownUrgency(4)).toBe('upcoming');
    expect(getCountdownUrgency(7)).toBe('upcoming');
  });

  it('returns "future" for 8+ days', () => {
    expect(getCountdownUrgency(8)).toBe('future');
    expect(getCountdownUrgency(100)).toBe('future');
  });
});

describe('detectNewReleasesThisWeek', () => {
  it('returns empty for empty input', () => {
    expect(detectNewReleasesThisWeek([])).toEqual([]);
    expect(detectNewReleasesThisWeek(null)).toEqual([]);
  });

  it('detects items released this week', () => {
    const today = new Date().toISOString().split('T')[0];
    const items = [{ id: '1', title: 'Test', releaseDate: today }];
    const result = detectNewReleasesThisWeek(items);
    expect(result.length).toBe(1);
    expect(result[0].releaseType).toBe('movie');
  });

  it('detects upcoming episodes this week', () => {
    const today = new Date().toISOString().split('T')[0];
    const items = [{
      id: '1', title: 'Test',
      nextEpisode: { season: 2, episode: 5, releaseDate: today },
    }];
    const result = detectNewReleasesThisWeek(items);
    expect(result.length).toBe(1);
    expect(result[0].releaseType).toBe('episode');
    expect(result[0].episodeInfo).toBe('S2E5');
  });

  it('excludes items from other weeks', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const items = [{ id: '1', title: 'Test', releaseDate: future.toISOString().split('T')[0] }];
    const result = detectNewReleasesThisWeek(items);
    expect(result.length).toBe(0);
  });
});

describe('detectLeavingSoon', () => {
  it('returns empty for empty input', () => {
    expect(detectLeavingSoon([])).toEqual([]);
    expect(detectLeavingSoon(null)).toEqual([]);
  });

  it('detects items leaving within threshold', () => {
    const leaving = new Date();
    leaving.setDate(leaving.getDate() + 5);
    const items = [{ id: '1', title: 'Test', leavingDate: leaving.toISOString().split('T')[0] }];
    const result = detectLeavingSoon(items, 14);
    expect(result.length).toBe(1);
    expect(result[0].daysLeft).toBeLessThanOrEqual(14);
  });

  it('excludes items leaving after threshold', () => {
    const leaving = new Date();
    leaving.setDate(leaving.getDate() + 30);
    const items = [{ id: '1', title: 'Test', leavingDate: leaving.toISOString().split('T')[0] }];
    const result = detectLeavingSoon(items, 14);
    expect(result.length).toBe(0);
  });

  it('excludes items with no leavingDate', () => {
    const items = [{ id: '1', title: 'Test' }];
    const result = detectLeavingSoon(items);
    expect(result.length).toBe(0);
  });

  it('sorts by daysLeft ascending', () => {
    const d1 = new Date(); d1.setDate(d1.getDate() + 2);
    const d2 = new Date(); d2.setDate(d2.getDate() + 10);
    const items = [
      { id: '1', title: 'Later', leavingDate: d2.toISOString().split('T')[0] },
      { id: '2', title: 'Sooner', leavingDate: d1.toISOString().split('T')[0] },
    ];
    const result = detectLeavingSoon(items, 14);
    expect(result[0].title).toBe('Sooner');
    expect(result[1].title).toBe('Later');
  });
});
