const STREAM_SERVICE_URL = import.meta.env.VITE_STREAM_SERVICE_URL || "";

const BASE_SERVERS = [
  {
    name: "Server 1",
    url: (id, s, e) =>
      s
        ? `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}&color=%230A84FF&autoplay=true&controls=false&autoskip=false&autonext=false`
        : `https://cinesrc.st/embed/movie/${id}?color=%230A84FF&autoplay=true&controls=false`,
  },
  {
    name: "Server 2 (Fast)",
    url: (id, s, e, imdb) =>
      s
        ? `https://vidlink.pro/tv/${imdb || id}/${s}/${e}`
        : `https://vidlink.pro/movie/${imdb || id}`,
  },
  {
    name: "Server 3 (HD)",
    url: (id, s, e, imdb) =>
      s
        ? `https://www.2embed.cc/embedtv/${imdb || id}&s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${imdb || id}`,
  },
  {
    name: "Server 4 (Backup)",
    url: (id, s, e, imdb) =>
      s
        ? `https://vidsrcme.ru/embed/tv?${imdb ? "imdb=" + imdb : "tmdb=" + id}&season=${s}&episode=${e}`
        : `https://vidsrcme.ru/embed/movie?${imdb ? "imdb=" + imdb : "tmdb=" + id}`,
  },
];

export class VideoSourceAdapter {
  // Direct server only appears when the stream service is configured
  static SERVERS = STREAM_SERVICE_URL
    ? [
        { name: "Direct", direct: true, url: () => "direct://" },
        ...BASE_SERVERS,
      ]
    : BASE_SERVERS;

  static getServers() {
    return this.SERVERS;
  }

  static getStreamUrl(serverIndex, movieId, season, episode, imdbId) {
    const index =
      serverIndex >= 0 && serverIndex < this.SERVERS.length ? serverIndex : 0;
    const server = this.SERVERS[index];
    return server.url(movieId, season, episode, imdbId);
  }

  static isDirectServer(serverIndex) {
    return this.SERVERS[serverIndex]?.direct === true;
  }

  static async fetchDirectStreamUrl(tmdbId, type = "movie", season, episode) {
    if (!STREAM_SERVICE_URL) throw new Error("Stream service not configured");
    const params = new URLSearchParams({ tmdbId, type });
    if (season) params.set("season", season);
    if (episode) params.set("episode", episode);
    const res = await fetch(`${STREAM_SERVICE_URL}/api/stream?${params}`);
    if (!res.ok) throw new Error(`Stream extraction failed: ${res.status}`);
    const data = await res.json();
    if (!data.streamUrl) throw new Error("No stream URL found");
    // Route through the CORS proxy so HLS.js can fetch m3u8/segments cross-origin
    return `${STREAM_SERVICE_URL}/api/proxy?url=${encodeURIComponent(data.streamUrl)}`;
  }
}
