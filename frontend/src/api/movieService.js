import { apiClient } from "./apiClient";

export const movieService = {
  getStreamUrl: async (
    id,
    serverIndex = 0,
    season,
    episode,
    platform = "netflix",
  ) => {
    const params = { server: serverIndex, platform };
    if (season !== undefined) params.season = season;
    if (episode !== undefined) params.episode = episode;
    const res = await apiClient.get(`/movies/${id}/stream-url`, { params });
    return res.data;
  },
  searchMovies: async (query) => {
    if (!query) return [];
    const res = await apiClient.get(`/movies/search`, {
      params: { q: query, _cb: "v2" },
    });
    return res.data;
  },

  getFeaturedMovies: async () => {
    const res = await apiClient.get(`/movies/featured`, {
      params: { platform: "all", _cb: "v2" },
    });
    return res.data;
  },

  getCategories: async (platform) => {
    const res = await apiClient.get(`/movies/categories`, {
      params: { platform, _cb: "v2" },
    });
    return res.data;
  },

  getMovieDetails: async (id, platform) => {
    const res = await apiClient.get(`/movies/${id}`, {
      params: { platform, _cb: "v2" },
    });
    return res.data;
  },

  getSimilarMovies: async (id, platform) => {
    const res = await apiClient.get(`/movies/${id}/similar`, {
      params: { platform, _cb: "v2" },
    });
    return res.data;
  },

  getSeasonEpisodes: async (id, seasonNumber, platform) => {
    const res = await apiClient.get(`/movies/${id}/season/${seasonNumber}`, {
      params: { platform, _cb: "v2" },
    });
    return res.data;
  },

  getExternalIds: async (id, platform) => {
    const res = await apiClient.get(`/movies/${id}/external_ids`, {
      params: { platform, _cb: "v2" },
    });
    return res.data;
  },

  getIntroTimings: async (id, season, episode, platform) => {
    const res = await apiClient.get(`/movies/${id}/intro`, {
      params: { season, episode, platform, _cb: "v2" },
    });
    return res.data;
  },

  getPersonDetails: async (id) => {
    const res = await apiClient.get(`/person/${id}`);
    return res.data;
  },
};
