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

  it('handles empty array', () => {
    expect(safeFilter([], x => x > 1)).toEqual([]);
  });

  it('handles predicate with truthy values', () => {
    expect(safeFilter([1, 2, 3], x => x > 1)).toEqual([2, 3]);
  });

  it('handles predicate returning falsy for all', () => {
    expect(safeFilter([0, '', null, false], x => x > 5)).toEqual([]);
  });

  it('handles nested array', () => {
    const nested = [[1], [2], [3]];
    expect(safeFilter(nested, x => x.length > 0)).toEqual(nested);
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

  it('handles empty array', () => {
    expect(safeMap([], x => x * 2)).toEqual([]);
  });

  it('handles mapping to objects', () => {
    expect(safeMap([1, 2], x => ({ id: x }))).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('handles mapping to null', () => {
    expect(safeMap([1, 2], () => null)).toEqual([null, null]);
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

  it('handles empty array', () => {
    expect(safeSlice([], 0, 2)).toEqual([]);
  });

  it('handles slice beyond array length', () => {
    expect(safeSlice([1], 0, 100)).toEqual([1]);
  });

  it('handles negative start', () => {
    expect(safeSlice([1, 2, 3], -2)).toEqual([2, 3]);
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

  it('finds first match', () => {
    expect(safeFind([1, 2, 2, 3], x => x === 2)).toBe(2);
  });

  it('finds objects by property', () => {
    const items = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    expect(safeFind(items, x => x.id === 2).name).toBe('b');
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

  it('returns false for undefined', () => {
    expect(safeSome(undefined, x => x === 1)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(safeSome([], x => x === 1)).toBe(false);
  });

  it('returns true for complex condition', () => {
    expect(safeSome([{ a: 1 }, { a: 3 }], x => x.a > 2)).toBe(true);
  });
});

describe('safeSort', () => {
  it('sorts normally', () => {
    expect(safeSort([3, 1, 2], (a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('returns empty array for null', () => {
    expect(safeSort(null, (a, b) => a - b)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(safeSort(undefined, (a, b) => a - b)).toEqual([]);
  });

  it('does not mutate original array', () => {
    const original = [3, 1, 2];
    safeSort(original, (a, b) => a - b);
    expect(original).toEqual([3, 1, 2]);
  });

  it('sorts strings alphabetically', () => {
    expect(safeSort(['c', 'a', 'b'], (a, b) => a.localeCompare(b))).toEqual(['a', 'b', 'c']);
  });

  it('handles single-element array', () => {
    expect(safeSort([1], (a, b) => a - b)).toEqual([1]);
  });

  it('handles already-sorted array', () => {
    expect(safeSort([1, 2, 3], (a, b) => a - b)).toEqual([1, 2, 3]);
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

  it('returns empty array for empty array', () => {
    expect(toArray([])).toEqual([]);
  });

  it('handles number 0', () => {
    expect(toArray(0)).toEqual([]);
  });

  it('handles empty string', () => {
    expect(toArray('')).toEqual([]);
  });

  it('handles Map', () => {
    const map = new Map([['a', 1], ['b', 2]]);
    const result = toArray(map);
    expect(result.length).toBe(2);
  });
});
