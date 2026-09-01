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
      staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

    // 2. Prefetch recommendations to make the bottom of the page feel instant
    queryClient.prefetchQuery({
      queryKey: ["recommendations", movieId, platform],
      queryFn: () => movieService.getRecommendations(movieId, platform),
      staleTime: 1000 * 60 * 60,
    });
  }

  /**
   * Prefetches categories for a specific platform when switching tabs
   */
  static prefetchPlatformCategories(platform) {
    queryClient.prefetchQuery({
      queryKey: ["categories", platform],
      queryFn: () => movieService.getCategories(platform),
      staleTime: 1000 * 60 * 60,
    });
  }
}
