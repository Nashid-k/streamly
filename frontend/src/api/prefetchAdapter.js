import { queryClient } from "../queryClient";
import { movieService } from "./movieService";

// Track in-flight prefetches to avoid duplicate requests (#19 fix)
const inFlightPrefetches = new Set();

export class PrefetchAdapter {
  /**
   * Prefetches full movie details (and episodes if it's a TV show)
   * Call this on onMouseEnter of a MovieCard.
   */
  static prefetchMovieDetails(movieId, platform) {
    if (!movieId) return;

    const key = `${movieId}-${platform}`;
    if (inFlightPrefetches.has(key)) return; // Already prefetching
    inFlightPrefetches.add(key);

    // Safety: remove from in-flight set after 30s even if promise never resolves
    const safetyTimer = setTimeout(() => inFlightPrefetches.delete(key), 30000);

    // 1. Prefetch core movie details
    const p1 = queryClient.prefetchQuery({
      queryKey: ["movie", movieId, platform],
      queryFn: () => movieService.getMovieDetails(movieId, platform),
      staleTime: 10 * 60 * 1000,
    });
    if (p1 && typeof p1.finally === 'function') {
      p1.finally(() => { clearTimeout(safetyTimer); inFlightPrefetches.delete(key); });
    } else {
      clearTimeout(safetyTimer);
      inFlightPrefetches.delete(key);
    }

    // 2. Prefetch similar movies to make the bottom of the page feel instant
    queryClient.prefetchQuery({
      queryKey: ["similar", movieId, platform],
      queryFn: () => movieService.getSimilarMovies(movieId, platform),
      staleTime: 10 * 60 * 1000,
    });
  }

  /**
   * Prefetches categories for a specific platform when switching tabs
   */
  static prefetchPlatformCategories(platform) {
    queryClient.prefetchQuery({
      queryKey: ["categories", platform],
      queryFn: () => movieService.getCategories(platform),
      staleTime: 10 * 60 * 1000,
    });
  }
}
