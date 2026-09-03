import { describe, it, expect } from 'vitest';
import { getRatingColor } from '../utils/ratings';

describe('getRatingColor', () => {
  it('returns green for high ratings (>= 8)', () => {
    expect(getRatingColor(8)).toBe('#4ade80');
    expect(getRatingColor(9.5)).toBe('#4ade80');
    expect(getRatingColor(10)).toBe('#4ade80');
  });

  it('returns yellow for medium ratings (>= 6.5)', () => {
    expect(getRatingColor(6.5)).toBe('#fbbf24');
    expect(getRatingColor(7.9)).toBe('#fbbf24');
  });

  it('returns red for low ratings (> 0)', () => {
    expect(getRatingColor(1)).toBe('#f87171');
    expect(getRatingColor(5)).toBe('#f87171');
    expect(getRatingColor(6.4)).toBe('#f87171');
  });

  it('returns null for zero or no rating', () => {
    expect(getRatingColor(0)).toBeNull();
    expect(getRatingColor(null)).toBeNull();
    expect(getRatingColor(undefined)).toBeNull();
  });

  it('handles negative ratings', () => {
    expect(getRatingColor(-1)).toBeNull();
  });
});
