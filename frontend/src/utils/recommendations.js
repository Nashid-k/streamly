/**
 * recommendations.js — Deep recommendation engine
 *
 * Goes beyond "similar genre" to find:
 *   • Director chains (Nolan → scored by Zimmer → other Nolan films)
 *   • Actor connections (actor in X also in Y)
 *   • Thematic links (layered narratives, heist films, time loops)
 *   • Shared creative DNA (same writer, producer, cinematographer)
 */

import { normalizeMovieSource } from "../api/platformAdapter";

// ─── Thematic Clusters ──────────────────────────────────────────────────────
// Predefined thematic groups for when genre alone isn't enough
const THEMATIC_CLUSTERS = {
  "mind-bending": ["Inception", "Interstellar", "The Matrix", "Shutter Island", "Fight Club", "Prestige", "Tenet", "Oppenheimer", "Arrival", "Memento"],
  "heist": ["Money Heist", "Ocean's", "The Italian Job", "Inside Man", "Baby Driver", "Heat", "Ronin", "The Town", "Snatch"],
  "time-loop": ["Groundhog Day", "Edge of Tomorrow", "Russian Doll", " Palm Springs", "ARQ", "Happy Death Day", "Before I Fall", "The Map of Tiny Perfect Things"],
  "dystopia": ["Black Mirror", "The Handmaid's Tale", "Brave New World", "1984", "Fahrenheit 451", "The Hunger Games", "Divergent", "Maze Runner"],
  "noir": ["True Detective", "Chinatown", "L.A. Confidential", "The Big Lebowski", "Blade Runner", "Sin City", "Se7en", "Zodiac"],
  "family-drama": ["Succession", "The Crown", "Game of Thrones", "Yellowstone", "Big Little Lies", "The Bear", "Shameless", "Ozark"],
  "sci-fi-hard": ["The Expanse", "Arrival", "Interstellar", "Gravity", "The Martian", "Ad Astra", "Blade Runner 2049", "Annihilation"],
  "psychological-thriller": ["Mindhunter", "Hannibal", "You", "Killing Eve", "Sharp Objects", "The Night Of", "Criminal Minds"],
};

// ─── Deep Recommendation Builder ────────────────────────────────────────────

/**
 * Build deep recommendations for a movie/show based on multiple signals.
 *
 * @param {Object} movie - The source movie/show
 * @param {Array} allMovies - All available movies in the catalog
 * @param {Object} options - { maxResults, includeSource }
 * @returns {Array} Ranked recommendations with match reasons
 */
export function buildDeepRecommendations(movie, allMovies = [], options = {}) {
  const { maxResults = 20, includeSource = false } = options;
  if (!movie || !allMovies.length) return [];

  const scored = new Map();

  const addCandidate = (m, score, reason, signal) => {
    if (!m || !m.id) return;
    if (includeSource === false && String(m.id) === String(movie.id)) return;
    const key = String(m.id);
    const existing = scored.get(key);
    if (existing) {
      // Accumulate scores from multiple signals
      existing.score += score;
      if (!existing.reasons.some(r => r.signal === signal)) {
        existing.reasons.push({ reason, signal, score });
      }
    } else {
      scored.set(key, {
        movie: normalizeMovieSource(m),
        score,
        reasons: [{ reason, signal, score }],
      });
    }
  };

  // ── Signal 1: Same Director ──
  if (movie.director) {
    for (const m of allMovies) {
      if (m.director && m.director.toLowerCase() === movie.director.toLowerCase()) {
        addCandidate(m, 40, `Directed by ${movie.director}`, "director");
      }
    }
  }

  // ── Signal 2: Shared Cast (top-billed actors) ──
  if (movie.cast && movie.cast.length > 0) {
    const topActors = movie.cast.slice(0, 5);
    for (const actor of topActors) {
      const actorName = typeof actor === "string" ? actor : actor.name;
      if (!actorName) continue;
      for (const m of allMovies) {
        if (m.id === movie.id) continue;
        if (m.cast && m.cast.some(a => {
          const name = typeof a === "string" ? a : a.name;
          return name && name.toLowerCase() === actorName.toLowerCase();
        })) {
          addCandidate(m, 25, `Features ${actorName}`, "actor");
        }
      }
    }
  }

  // ── Signal 3: Same Writer ──
  if (movie.writers && movie.writers.length > 0) {
    for (const writer of movie.writers) {
      for (const m of allMovies) {
        if (m.writers && m.writers.some(w => w.toLowerCase() === writer.toLowerCase())) {
          addCandidate(m, 20, `Written by ${writer}`, "writer");
        }
      }
    }
  }

  // ── Signal 4: Genre Overlap (weighted) ──
  if (movie.genres && movie.genres.length > 0) {
    const movieGenres = new Set(movie.genres.map(g => g.toLowerCase()));
    for (const m of allMovies) {
      if (m.id === movie.id || !m.genres) continue;
      const overlap = m.genres.filter(g => movieGenres.has(g.toLowerCase()));
      if (overlap.length >= 2) {
        addCandidate(m, 15 * overlap.length, `Shares ${overlap.join(", ")} genres`, "genre");
      } else if (overlap.length === 1) {
        addCandidate(m, 8, `Also ${overlap[0]}`, "genre");
      }
    }
  }

  // ── Signal 5: Thematic Cluster Match ──
  for (const [cluster, titles] of Object.entries(THEMATIC_CLUSTERS)) {
    const isInCluster = titles.some(t =>
      movie.title && movie.title.toLowerCase().includes(t.toLowerCase())
    );
    if (isInCluster) {
      for (const m of allMovies) {
        if (m.id === movie.id) continue;
        const matchesCluster = titles.some(t =>
          m.title && m.title.toLowerCase().includes(t.toLowerCase())
        );
        if (matchesCluster) {
          addCandidate(m, 30, `Similar thematic feel (${cluster})`, "theme");
        }
      }
    }
  }

  // ── Signal 6: High Rating Boost ──
  for (const [key, candidate] of scored) {
    if (candidate.movie.imdbRating >= 8.0) {
      candidate.score += 10;
    }
  }

  // ── Signal 7: Same Production Company ──
  if (movie.productionCompanies && movie.productionCompanies.length > 0) {
    for (const company of movie.productionCompanies) {
      for (const m of allMovies) {
        if (m.id === movie.id) continue;
        if (m.productionCompanies && m.productionCompanies.some(c => c.toLowerCase() === company.toLowerCase())) {
          addCandidate(m, 12, `Produced by ${company}`, "production");
        }
      }
    }
  }

  // ── Sort by score and return top results ──
  return Array.from(scored.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ movie, score, reasons }) => ({
      ...movie,
      matchScore: Math.min(99, Math.round((score / 100) * 100)),
      matchReason: reasons.sort((a, b) => b.score - a.score)[0]?.reason || "Similar",
      matchSignals: reasons.map(r => r.signal),
    }));
}

/**
 * Generate "Because you watched X" section data.
 */
export function buildBecauseYouWatched(movie, allMovies) {
  if (!movie || !allMovies.length) return { title: "", movies: [] };

  const recommendations = buildDeepRecommendations(movie, allMovies, { maxResults: 12 });

  // Find the strongest signal for the section title
  const topReason = recommendations[0]?.matchReason;
  const title = topReason
    ? `Because you ${topReason.includes("Directed") ? "liked" : "watched"} ${movie.title}`
    : `Because you watched ${movie.title}`;

  return { title, movies: recommendations };
}
