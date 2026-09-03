/**
 * searchRanking.js — Aggressive search result relevance scoring
 *
 * Ensures exact title matches ALWAYS appear first, followed by
 * strong partial matches, then everything else.
 *
 * Scoring scale (0-100):
 *   100 = exact match (title === query)
 *    95 = title starts with query
 *    90 = query starts with title (user typed more)
 *    85 = all query words in title, correct order, adjacent
 *    80 = all query words in title, correct order
 *    75 = all query words in title, any order
 *    65 = title contains query as substring
 *    55 = majority of query words match title words
 *    40 = some query words match
 *    25 = partial character match
 *     0 = no match
 */

/**
 * Score a movie's relevance to a search query.
 * @param {Object} movie - Movie/show object with title
 * @param {string} query - Search query
 * @returns {number} Relevance score (0-100)
 */
export function getSearchRelevance(movie, query) {
  if (!movie || !query) return 0;

  const title = (movie.title || movie.name || "").toLowerCase().trim();
  const q = query.toLowerCase().trim();

  if (!title || !q) return 0;

  // ── TIER 1: Exact / near-exact (88-100) ──

  // Exact match — the holy grail
  if (title === q) return 100;

  // Title starts with query
  if (title.startsWith(q)) {
    // Word boundary check: is the query a complete word in the title?
    // e.g. "hi" in "Hi Nanna" = word boundary (followed by space)
    //      "hi" in "HIM" = NOT a word boundary (followed by letter)
    const afterChar = title[q.length] || '';
    const isWordBoundary = !afterChar || /[^a-z0-9]/i.test(afterChar);
    if (isWordBoundary) return 98; // "Hi Nanna" when searching "hi"
    return 95; // "HIM", "Hit Man" when searching "hi"
  }

  // Query starts with title (user typed more than the title)
  if (q.startsWith(title) && title.length >= 3) return 88;

  // ── TIER 2: Strong word matches (70-85) ──

  const queryWords = q.split(/\s+/).filter(Boolean);
  const titleWords = title.split(/\s+/);

  if (queryWords.length >= 2) {
    // All query words appear in title
    const matchedIndices = [];
    const allMatched = queryWords.every((qw) => {
      const idx = titleWords.findIndex(
        (tw, i) => !matchedIndices.includes(i) && (tw === qw || tw.includes(qw) || qw.includes(tw)),
      );
      if (idx >= 0) { matchedIndices.push(idx); return true; }
      return false;
    });

    if (allMatched) {
      // Check if words are in correct order
      const inOrder = matchedIndices.every((v, i) => i === 0 || v > matchedIndices[i - 1]);
      if (inOrder) {
        // Check if words are adjacent (no gaps)
        const isConsecutive = matchedIndices.every(
          (v, i) => i === 0 || v === matchedIndices[i - 1] + 1,
        );
        if (isConsecutive) return 85; // Adjacent + ordered
        return 80; // Ordered but not adjacent
      }
      return 75; // All words present but wrong order
    }
  }

  // ── TIER 3: Substring / partial matches (40-65) ──

  // Title contains full query as substring
  if (title.includes(q)) return 65;

  // Majority of query words match
  if (queryWords.length > 1) {
    const matchCount = queryWords.filter((qw) =>
      titleWords.some((tw) => tw.includes(qw) || qw.includes(tw)),
    ).length;
    const ratio = matchCount / queryWords.length;
    if (ratio >= 0.5) return 55;
  }

  // Any single query word matches a title word (exact word match)
  if (queryWords.some((qw) => titleWords.some((tw) => tw === qw))) return 45;

  // Any query word is contained in a title word
  if (queryWords.some((qw) => titleWords.some((tw) => tw.includes(qw) || qw.includes(tw)))) return 40;

  // ── TIER 4: Weak matches (0-25) ──

  // Partial character match (at least 60% of query prefix appears)
  const minLen = Math.max(3, Math.floor(q.length * 0.6));
  const prefix = q.substring(0, minLen);
  if (title.includes(prefix)) return 25;

  // Single character overlap
  if (q.length >= 3 && title.includes(q[0])) return 10;

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

  const q = query.toLowerCase().trim();

  return results
    .map((m) => ({
      ...m,
      _relevance: getSearchRelevance(m, query),
    }))
    .sort((a, b) => {
      // Primary: relevance score (highest first)
      if (b._relevance !== a._relevance) return b._relevance - a._relevance;

      // Secondary: exact title bonus — if one title exactly matches query, it wins
      const aExact = (a.title || "").toLowerCase().trim() === q;
      const bExact = (b.title || "").toLowerCase().trim() === q;
      if (aExact !== bExact) return aExact ? -1 : 1;

      // Tertiary: title length (shorter = more likely the intended match)
      const aLen = (a.title || "").length;
      const bLen = (b.title || "").length;
      if (aLen !== bLen) return aLen - bLen;

      // Quaternary: IMDb rating
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
 * @returns {Array} Suggested title strings
 */
export function getDidYouMean(query, results = [], threshold = 0.4) {
  if (!query || !results.length) return [];

  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const suggestions = results
    .map((m) => {
      const title = (m.title || m.name || "").toLowerCase();
      if (!title) return null;

      const similarity = getStringSimilarity(q, title);
      if (similarity >= threshold && title !== q) {
        return { title: m.title || m.name, similarity, id: m.id };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  // Deduplicate by title
  const seen = new Set();
  return suggestions.filter((s) => {
    const key = s.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
