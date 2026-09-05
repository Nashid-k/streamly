import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrefetchAdapter } from "../api/prefetchAdapter";
import { movieService } from "../api/movieService";
import { queryClient } from "../queryClient";

vi.mock("../api/movieService", () => ({
  movieService: {
    getMovieDetails: vi.fn(async () => ({ id: 12345, title: "Test Movie" })),
    getSimilarMovies: vi.fn(async () => []),
    getCategories: vi.fn(async () => []),
  },
}));

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("PrefetchAdapter (hover prefetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("caches under the exact keys TitleDetails consumes (no platform qualifier)", async () => {
    PrefetchAdapter.prefetchMovieDetails("tmdb-424242");
    await flush();

    // TitleDetails queries ["movie", id] and ["similar", id] — the prefetched
    // data must live under those same keys or it is never read.
    expect(queryClient.getQueryData(["movie", "tmdb-424242"])).toEqual({
      id: 12345,
      title: "Test Movie",
    });
    expect(queryClient.getQueryData(["similar", "tmdb-424242"])).toEqual([]);

    // ...and must NOT live under platform-qualified keys (the old bug).
    expect(queryClient.getQueryData(["movie", "tmdb-424242", "netflix"])).toBeUndefined();
    expect(movieService.getMovieDetails).toHaveBeenCalledTimes(1);
    expect(movieService.getSimilarMovies).toHaveBeenCalledTimes(1);
  });

  it("does not fire a second network request when the same card is hovered again", async () => {
    PrefetchAdapter.prefetchMovieDetails("tmdb-777");
    PrefetchAdapter.prefetchMovieDetails("tmdb-777"); // rapid second hover
    await flush();

    expect(movieService.getMovieDetails).toHaveBeenCalledTimes(1);
    expect(movieService.getSimilarMovies).toHaveBeenCalledTimes(1);
  });

  it("serves the TitleDetails fetch from cache instead of re-requesting", async () => {
    PrefetchAdapter.prefetchMovieDetails("tmdb-888");
    await flush();

    // What TitleDetails does on mount after navigation:
    const data = await queryClient.fetchQuery({
      queryKey: ["movie", "tmdb-888"],
      queryFn: () => movieService.getMovieDetails("tmdb-888"),
    });

    expect(data.title).toBe("Test Movie");
    // The consumer fetch hit the cache — no second call to the backend.
    expect(movieService.getMovieDetails).toHaveBeenCalledTimes(1);
  });
});
