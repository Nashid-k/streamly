import { describe, it, expect } from 'vitest';
import { buildDeepRecommendations, buildBecauseYouWatched } from '../utils/recommendations';

const baseMovie = {
  id: '1',
  title: 'Inception',
  genres: ['Action', 'Sci-Fi', 'Thriller'],
  director: 'Christopher Nolan',
  cast: ['Leonardo DiCaprio', 'Tom Hardy'],
  writers: ['Christopher Nolan'],
  imdbRating: 8.8,
  productionCompanies: ['Warner Bros.'],
};

const allMovies = [
  baseMovie,
  {
    id: '2',
    title: 'Interstellar',
    genres: ['Sci-Fi', 'Drama'],
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway'],
    writers: ['Christopher Nolan'],
    imdbRating: 8.6,
    productionCompanies: ['Warner Bros.'],
  },
  {
    id: '3',
    title: 'The Dark Knight',
    genres: ['Action', 'Crime'],
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger'],
    imdbRating: 9.0,
    productionCompanies: ['Warner Bros.'],
  },
  {
    id: '4',
    title: 'Random Movie',
    genres: ['Comedy'],
    director: 'Someone Else',
    cast: ['Unknown Actor'],
    imdbRating: 6.0,
  },
];

describe('buildDeepRecommendations', () => {
  it('returns empty for null inputs', () => {
    expect(buildDeepRecommendations(null, [])).toEqual([]);
    expect(buildDeepRecommendations(baseMovie, [])).toEqual([]);
    expect(buildDeepRecommendations(null, allMovies)).toEqual([]);
  });

  it('excludes the source movie', () => {
    const recs = buildDeepRecommendations(baseMovie, allMovies);
    expect(recs.every(r => r.id !== baseMovie.id)).toBe(true);
  });

  it('ranks same-director movies higher', () => {
    const recs = buildDeepRecommendations(baseMovie, allMovies);
    const directorMatch = recs.find(r => r.director === 'Christopher Nolan');
    expect(directorMatch).toBeTruthy();
    expect(directorMatch.matchSignals).toContain('director');
  });

  it('ranks shared-cast movies higher', () => {
    const recs = buildDeepRecommendations(baseMovie, allMovies);
    // Interstellar has shared director + shared production company
    const interstellar = recs.find(r => r.id === '2');
    expect(interstellar).toBeTruthy();
    expect(interstellar.matchScore).toBeGreaterThan(0);
  });

  it('respects maxResults option', () => {
    const recs = buildDeepRecommendations(baseMovie, allMovies, { maxResults: 1 });
    expect(recs.length).toBeLessThanOrEqual(1);
  });

  it('includes matchScore and matchReason', () => {
    const recs = buildDeepRecommendations(baseMovie, allMovies);
    recs.forEach(rec => {
      expect(rec).toHaveProperty('matchScore');
      expect(rec).toHaveProperty('matchReason');
      expect(typeof rec.matchScore).toBe('number');
      expect(typeof rec.matchReason).toBe('string');
    });
  });

  it('matchScore is capped at 99', () => {
    const recs = buildDeepRecommendations(baseMovie, allMovies);
    recs.forEach(rec => {
      expect(rec.matchScore).toBeLessThanOrEqual(99);
    });
  });
});

describe('buildBecauseYouWatched', () => {
  it('returns empty for null inputs', () => {
    const result = buildBecauseYouWatched(null, []);
    expect(result.movies).toEqual([]);
    expect(result.title).toBe('');
  });

  it('generates a meaningful title', () => {
    const result = buildBecauseYouWatched(baseMovie, allMovies);
    expect(result.title).toContain('Inception');
  });

  it('returns recommendations', () => {
    const result = buildBecauseYouWatched(baseMovie, allMovies);
    expect(result.movies.length).toBeGreaterThan(0);
  });
});
