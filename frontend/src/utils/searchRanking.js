/**
 * searchRanking.js — Search result relevance scoring
 *
 * Ensures exact title matches appear first, followed by
 * partial matches, then everything else.
 */

/**
 * Score a movie's relevance to a search query.
 * Higher score = more relevant.
 *
 * @param {Object} movie - Movie/show object with title
 * @param {string} query - Search query
 * @returns {number} Relevance score (0-100)
 */
export function getSearchRelevance(movie, query) {
  if (!movie || !query) return 0;

  const title = (movie.title || movie.name || "").toLowerCase().trim();
  const q = query.toLowerCase().trim();

  if (!title || !q) return 0;

  // Exact match (highest priority)
  if (title === q) return 100;

  // Title starts with query
  if (title.startsWith(q)) return 90;

  // Query starts with title (user typed more than the title)
  if (q.startsWith(title)) return 85;

  // Exact word match — all query words appear in title in order
  const queryWords = q.split(/\s+/).filter(Boolean);
  const titleWords = title.split(/\s+/);

  if (queryWords.length > 1) {
    // Check if all query words appear in title
    const allWordsPresent = queryWords.every(w => titleWords.some(tw => tw.includes(w)));
    if (allWordsPresent) {
      // Bonus: words appear in the correct order
      let lastIdx = -1;
      const inOrder = queryWords.every(w => {
        const idx = titleWords.findIndex((tw, i) => i > lastIdx && tw.includes(w));
        if (idx >= 0) { lastIdx = idx; return true; }
        return false;
      });
      if (inOrder) return 75;
      return 65;
    }
  }

  // Title contains query as substring
  if (title.includes(q)) return 60;

  // Any query word matches a title word
  if (queryWords.some(w => titleWords.some(tw => tw.includes(w)))) return 40;

  // Partial character match
  if (title.includes(q.substring(0, Math.max(3, Math.floor(q.length * 0.6))))) return 20;

  // No match at all
  return 0;
}

/**
 * Rank search results by relevance to query.
 * Returns sorted array with most relevant first.
 *
 * @param {Array} results - Array of movie objects
 * @param {string} query - Search query
 * @returns {Array} Sorted results with relevance scores
 */
export function rankSearchResults(results, query) {
  if (!results || !query) return results || [];

  return results
    .map(m => ({
      ...m,
      _relevance: getSearchRelevance(m, query),
    }))
    .sort((a, b) => {
      // Primary sort: relevance score (highest first)
      if (b._relevance !== a._relevance) return b._relevance - a._relevance;
      // Secondary sort: IMDb rating
      return (b.imdbRating || 0) - (a.imdbRating || 0);
    });
}

/**
 * Find "Did you mean" suggestions when no exact match exists.
 * Uses Levenshtein-like distance for fuzzy matching.
 *
 * @param {string} query - Search query
 * @param {Array} results - Available results
 * @param {number} threshold - Minimum similarity (0-1) to consider a suggestion
 * @returns {Array} Suggested titles
 */
export function getDidYouMean(query, results = [], threshold = 0.4) {
  if (!query || !results.length) return [];

  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const suggestions = results
    .map(m => {
      const title = (m.title || m.name || "").toLowerCase();
      if (!title) return null;

      // Calculate similarity
      const similarity = getStringSimilarity(q, title);
      if (similarity >= threshold && title !== q) {
        return { title: m.title || m.name, similarity, id: m.id };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  return suggestions;
}

/**
 * Calculate string similarity using longest common subsequence ratio.
 * Returns value between 0 (no match) and 1 (identical).
 */
function getStringSimilarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1;

  // Quick check: does the shorter string appear in the longer?
  if (longer.includes(shorter)) return shorter.length / longer.length;

  // LCS-based similarity
  const lcsLen = longestCommonSubsequence(a, b);
  return lcsLen / longer.length;
}

function longestCommonSubsequence(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
