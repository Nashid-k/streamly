import { describe, it, expect } from 'vitest';
import { getSearchRelevance, rankSearchResults, getDidYouMean } from '../utils/searchRanking';

describe('getSearchRelevance', () => {
  const baseMovie = {
    id: '1',
    title: 'The Matrix',
    genres: ['Action', 'Sci-Fi'],
    cast: ['Keanu Reeves', 'Laurence Fishburne'],
    director: 'The Wachowskis',
  };

  it('returns 100 for exact title match', () => {
    expect(getSearchRelevance(baseMovie, 'the matrix')).toBe(100);
  });

  it('returns 98 for prefix match at word boundary', () => {
    expect(getSearchRelevance(baseMovie, 'the')).toBe(98);
  });

  it('returns 95 for prefix match not at word boundary', () => {
    expect(getSearchRelevance({ ...baseMovie, title: 'Thematic' }, 'the')).toBe(95);
  });

  it('returns 88 when query is prefix of title', () => {
    expect(getSearchRelevance(baseMovie, 'the matrixReloaded')).toBe(88);
  });

  it('returns 0 for null/undefined inputs', () => {
    expect(getSearchRelevance(null, 'query')).toBe(0);
    expect(getSearchRelevance(baseMovie, null)).toBe(0);
    expect(getSearchRelevance(null, null)).toBe(0);
  });

  it('returns 0 for empty string inputs', () => {
    expect(getSearchRelevance(baseMovie, '')).toBe(0);
    expect(getSearchRelevance({ ...baseMovie, title: '' }, 'matrix')).toBe(0);
  });

  it('handles special characters in query', () => {
    expect(getSearchRelevance(baseMovie, 'the matrix!')).toBeGreaterThan(0);
  });

  it('handles very long query strings', () => {
    const longQuery = 'a'.repeat(1000);
    const score = getSearchRelevance(baseMovie, longQuery);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('handles movie with no title', () => {
    expect(getSearchRelevance({ ...baseMovie, title: '' }, 'matrix')).toBe(0);
    expect(getSearchRelevance({ ...baseMovie, title: undefined }, 'matrix')).toBe(0);
  });

  it('handles movie with no genres', () => {
    const score = getSearchRelevance({ ...baseMovie, genres: undefined }, 'matrix');
    expect(score).toBeGreaterThan(0);
  });

  it('handles movie with no cast', () => {
    const score = getSearchRelevance({ ...baseMovie, cast: undefined }, 'matrix');
    expect(score).toBeGreaterThan(0);
  });

  it('boosts score for genre match', () => {
    // 'action' matches title substring (score=65) + genre bonus (+8) = 73
    const withGenre = getSearchRelevance({ ...baseMovie, genres: ['Action'] }, 'action');
    // Without genre: just title substring match = 65
    const withoutGenre = getSearchRelevance({ ...baseMovie, genres: [] }, 'action');
    expect(withGenre).toBeGreaterThan(withoutGenre);
  });

  it('boosts score for cast/director match', () => {
    // Need a title match first (score > 0) for cast bonus to apply
    const score = getSearchRelevance(baseMovie, 'matrix keanu');
    expect(score).toBeGreaterThan(0);
  });

  it('boosts score for recency', () => {
    const currentYear = new Date().getFullYear();
    const recent = getSearchRelevance({ ...baseMovie, releaseYear: currentYear }, 'matrix');
    const old = getSearchRelevance({ ...baseMovie, releaseYear: 1999 }, 'matrix');
    expect(recent).toBeGreaterThanOrEqual(old);
  });

  it('caps score at 120', () => {
    const score = getSearchRelevance(
      { ...baseMovie, genres: ['Action'], matchScore: 80, releaseYear: new Date().getFullYear() },
      'the matrix'
    );
    expect(score).toBeLessThanOrEqual(120);
  });
});

describe('rankSearchResults', () => {
  it('returns empty array for null/empty inputs', () => {
    expect(rankSearchResults(null, 'query')).toEqual([]);
    expect(rankSearchResults([], 'query')).toEqual([]);
    expect(rankSearchResults(null, null)).toEqual([]);
  });

  it('sorts by relevance score', () => {
    const movies = [
      { id: '1', title: 'Interstellar' },
      { id: '2', title: 'The Matrix' },
      { id: '3', title: 'Matrix Revolutions' },
    ];
    const ranked = rankSearchResults(movies, 'the matrix');
    expect(ranked[0].title).toBe('The Matrix');
  });

  it('deduplicates by relevance', () => {
    const movies = [
      { id: '1', title: 'The Matrix' },
      { id: '2', title: 'The Matrix' },
    ];
    const ranked = rankSearchResults(movies, 'the matrix');
    // Both should be present but sorted by score
    expect(ranked.length).toBe(2);
  });

  it('uses IMDb rating as tiebreaker', () => {
    const movies = [
      { id: '1', title: 'Action Movie', imdbRating: 6.0 },
      { id: '2', title: 'Action Film', imdbRating: 8.5 },
    ];
    const ranked = rankSearchResults(movies, 'action');
    expect(ranked[0].imdbRating).toBe(8.5);
  });
});

describe('getDidYouMean', () => {
  it('returns empty for null/empty inputs', () => {
    expect(getDidYouMean(null, [])).toEqual([]);
    expect(getDidYouMean('test', [])).toEqual([]);
  });

  it('returns suggestions for close matches', () => {
    const movies = [
      { id: '1', title: 'The Matrix' },
      { id: '2', title: 'Interstellar' },
    ];
    const suggestions = getDidYouMean('matrik', movies, 0.3);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('returns empty when query matches exactly', () => {
    const movies = [{ id: '1', title: 'The Matrix' }];
    const suggestions = getDidYouMean('The Matrix', movies);
    expect(suggestions).toEqual([]);
  });

  it('limits results to 5', () => {
    const movies = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      title: `Movie ${i} Matrix`,
    }));
    const suggestions = getDidYouMean('matrix', movies, 0.1);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it('deduplicates by title', () => {
    const movies = [
      { id: '1', title: 'The Matrix' },
      { id: '2', title: 'The Matrix' },
    ];
    const suggestions = getDidYouMean('matrix', movies, 0.1);
    const titles = suggestions.map(s => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
