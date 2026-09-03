import { describe, it, expect } from 'vitest';
import {
  normalizePlatformKey,
  normalizeMovieSource,
  mapSource,
  resolveAllPlatforms,
  PlatformAdapter,
  PLATFORMS,
} from '../api/platformAdapter';

describe('normalizePlatformKey', () => {
  it('returns null for null/undefined/empty', () => {
    expect(normalizePlatformKey(null)).toBeNull();
    expect(normalizePlatformKey(undefined)).toBeNull();
    expect(normalizePlatformKey('')).toBeNull();
    expect(normalizePlatformKey('   ')).toBeNull();
  });

  it('normalizes exact key matches', () => {
    expect(normalizePlatformKey('netflix')).toBe('netflix');
    expect(normalizePlatformKey('prime')).toBe('prime');
    expect(normalizePlatformKey('disney')).toBe('disney');
  });

  it('normalizes common variant strings', () => {
    expect(normalizePlatformKey('Netflix')).toBe('netflix');
    expect(normalizePlatformKey('Prime Video')).toBe('prime');
    expect(normalizePlatformKey('Amazon Prime')).toBe('prime');
    expect(normalizePlatformKey('Disney+')).toBe('disney');
    expect(normalizePlatformKey('Disney+ Hotstar')).toBe('hotstar');
    expect(normalizePlatformKey('Apple TV+')).toBe('appletv');
    expect(normalizePlatformKey('HBO Max')).toBe('max');
    expect(normalizePlatformKey('JioCinema')).toBe('jio');
    expect(normalizePlatformKey('Sony LIV')).toBe('sonyliv');
    expect(normalizePlatformKey('ZEE5')).toBe('zee5');
    expect(normalizePlatformKey('MX Player')).toBe('mxplayer');
    expect(normalizePlatformKey('Crunchyroll')).toBe('crunchyroll');
  });

  it('returns null for completely unknown strings', () => {
    expect(normalizePlatformKey('totallyunknown')).toBeNull();
  });

  it('handles case insensitive matching', () => {
    expect(normalizePlatformKey('NETFLIX')).toBe('netflix');
    expect(normalizePlatformKey('Prime')).toBe('prime');
  });
});

describe('normalizeMovieSource', () => {
  it('returns null source for null/undefined', () => {
    expect(normalizeMovieSource(null)).toEqual({ source: null, sourceName: null });
    expect(normalizeMovieSource(undefined)).toEqual({ source: null, sourceName: null });
  });

  it('preserves valid canonical source', () => {
    const movie = { id: '1', title: 'Test', source: 'netflix' };
    const result = normalizeMovieSource(movie);
    expect(result.source).toBe('netflix');
    expect(result.sourceName).toBe('Netflix');
  });

  it('normalizes raw source string', () => {
    const movie = { id: '1', title: 'Test', source: 'Prime Video' };
    const result = normalizeMovieSource(movie);
    expect(result.source).toBe('prime');
    expect(result.sourceName).toBe('Prime Video');
  });

  it('falls back to availablePlatforms', () => {
    const movie = { id: '1', title: 'Test', availablePlatforms: ['Netflix', 'Prime Video'] };
    const result = normalizeMovieSource(movie);
    expect(result.source).toBe('netflix');
  });

  it('returns null source when no platform data', () => {
    const movie = { id: '1', title: 'Test' };
    const result = normalizeMovieSource(movie);
    expect(result.source).toBeNull();
  });

  it('never defaults to Netflix when no data', () => {
    const movie = {};
    const result = normalizeMovieSource(movie);
    expect(result.source).not.toBe('netflix');
  });
});

describe('mapSource', () => {
  it('maps first available platform', () => {
    const movie = { availablePlatforms: ['Netflix', 'Prime'] };
    const result = mapSource(movie);
    expect(result.source).toBe('netflix');
  });

  it('returns null source when no available platforms', () => {
    const movie = { availablePlatforms: [] };
    const result = mapSource(movie);
    expect(result.source).toBeNull();
  });
});

describe('resolveAllPlatforms', () => {
  it('returns empty for null/undefined', () => {
    expect(resolveAllPlatforms(null)).toEqual([]);
    expect(resolveAllPlatforms({})).toEqual([]);
  });

  it('deduplicates platforms', () => {
    const movie = { availablePlatforms: ['Netflix', 'netflix', 'Netflix'] };
    expect(resolveAllPlatforms(movie)).toEqual(['netflix']);
  });

  it('skips unknown platforms', () => {
    const movie = { availablePlatforms: ['Netflix', 'UnknownPlatform'] };
    expect(resolveAllPlatforms(movie)).toEqual(['netflix']);
  });
});

describe('PlatformAdapter', () => {
  it('getName returns name for valid key', () => {
    expect(PlatformAdapter.getName('netflix')).toBe('Netflix');
  });

  it('getName returns id for unknown key', () => {
    expect(PlatformAdapter.getName('unknown')).toBe('unknown');
  });

  it('getCategory returns category for valid key', () => {
    expect(PlatformAdapter.getCategory('netflix')).toBe('global');
    expect(PlatformAdapter.getCategory('hotstar')).toBe('india');
  });

  it('isValid returns true for valid key', () => {
    expect(PlatformAdapter.isValid('netflix')).toBe(true);
    expect(PlatformAdapter.isValid('unknown')).toBe(false);
  });

  it('getAllKeys returns all platform keys', () => {
    const keys = PlatformAdapter.getAllKeys();
    expect(keys).toContain('netflix');
    expect(keys).toContain('prime');
    expect(keys.length).toBeGreaterThan(10);
  });

  it('getPlatformsByCategory returns platforms for category', () => {
    const globalPlatforms = PlatformAdapter.getPlatformsByCategory('global');
    expect(globalPlatforms.length).toBeGreaterThan(0);
    expect(globalPlatforms.every(p => p.category === 'global')).toBe(true);
  });

  it('getPlatformsByCategory returns empty for unknown category', () => {
    expect(PlatformAdapter.getPlatformsByCategory('unknown')).toEqual([]);
  });

  it('resolveFromRawName resolves raw strings', () => {
    expect(PlatformAdapter.resolveFromRawName('Netflix')?.id).toBe('netflix');
    expect(PlatformAdapter.resolveFromRawName(null)).toBeNull();
  });
});
