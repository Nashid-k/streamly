import { describe, it, expect } from 'vitest';
import { safeFilter, safeMap, safeSlice, safeFind, safeSome, safeSort, toArray } from '../utils/safeGuards';

describe('safeFilter', () => {
  it('filters normally on valid array', () => {
    expect(safeFilter([1, 2, 3], x => x > 1)).toEqual([2, 3]);
  });

  it('returns empty array for null', () => {
    expect(safeFilter(null, x => x > 1)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(safeFilter(undefined, x => x > 1)).toEqual([]);
  });

  it('returns empty array for non-array', () => {
    expect(safeFilter('not an array', x => x > 1)).toEqual([]);
  });
});

describe('safeMap', () => {
  it('maps normally on valid array', () => {
    expect(safeMap([1, 2, 3], x => x * 2)).toEqual([2, 4, 6]);
  });

  it('returns empty array for null', () => {
    expect(safeMap(null, x => x * 2)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(safeMap(undefined, x => x * 2)).toEqual([]);
  });
});

describe('safeSlice', () => {
  it('slices normally on valid array', () => {
    expect(safeSlice([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
  });

  it('returns empty array for null', () => {
    expect(safeSlice(null, 0, 2)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(safeSlice(undefined, 0, 2)).toEqual([]);
  });
});

describe('safeFind', () => {
  it('finds normally on valid array', () => {
    expect(safeFind([1, 2, 3], x => x === 2)).toBe(2);
  });

  it('returns undefined for null', () => {
    expect(safeFind(null, x => x === 2)).toBeUndefined();
  });

  it('returns undefined for non-match', () => {
    expect(safeFind([1, 2, 3], x => x === 99)).toBeUndefined();
  });
});

describe('safeSome', () => {
  it('returns true when predicate matches', () => {
    expect(safeSome([1, 2, 3], x => x === 2)).toBe(true);
  });

  it('returns false when no match', () => {
    expect(safeSome([1, 2, 3], x => x === 99)).toBe(false);
  });

  it('returns false for null', () => {
    expect(safeSome(null, x => x === 1)).toBe(false);
  });
});

describe('safeSort', () => {
  it('sorts normally', () => {
    expect(safeSort([3, 1, 2], (a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('returns empty array for null', () => {
    expect(safeSort(null, (a, b) => a - b)).toEqual([]);
  });

  it('does not mutate original array', () => {
    const original = [3, 1, 2];
    safeSort(original, (a, b) => a - b);
    expect(original).toEqual([3, 1, 2]);
  });
});

describe('toArray', () => {
  it('returns array as-is', () => {
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('returns empty array for non-iterable values', () => {
    expect(toArray(42)).toEqual([]);
    expect(toArray(true)).toEqual([]);
  });

  it('converts string (iterable) to array', () => {
    // Strings are iterable, so toArray spreads them
    expect(toArray('ab')).toEqual(['a', 'b']);
  });

  it('returns empty array for null', () => {
    expect(toArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(toArray(undefined)).toEqual([]);
  });

  it('converts iterable to array', () => {
    const set = new Set([1, 2, 3]);
    expect(toArray(set)).toEqual([1, 2, 3]);
  });
});
