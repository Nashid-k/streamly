import { queryClient } from "../main";
import { movieService } from "./movieService";

export class PrefetchAdapter {
  /**
   * Prefetches full movie details (and episodes if it's a TV show)
   * Call this on onMouseEnter of a MovieCard.
   */
  static prefetchMovieDetails(movieId, platform) {
    if (!movieId) return;

    // 1. Prefetch core movie details
    queryClient.prefetchQuery({
      queryKey: ["movie", movieId, platform],
      queryFn: () => movieService.getMovieDetails(movieId, platform),
      staleTime: 10 * 60 * 1000, // 10 minutes — longer than default 5min but not excessive
    });

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
