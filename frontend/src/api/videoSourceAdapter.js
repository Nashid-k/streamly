export class VideoSourceAdapter {
  static SERVERS = [
    {
      name: "Server 1",
      url: (id, s, e) =>
        s
          ? `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}&color=%23FF6B00&autoplay=true&autoskip=false&autonext=false&controls=false`
          : `https://cinesrc.st/embed/movie/${id}?color=%23FF6B00&autoplay=true&controls=false`,
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
          ? `https://vidsrc.pro/embed/tv?${imdb ? "imdb=" + imdb : "tmdb=" + id}&season=${s}&episode=${e}`
          : `https://vidsrc.pro/embed/movie?${imdb ? "imdb=" + imdb : "tmdb=" + id}`,
    },
    {
      name: "Server 4 (Backup)",
      url: (id, s, e, imdb) =>
        s
          ? `https://www.2embed.cc/embedtv/${imdb || id}&s=${s}&e=${e}`
          : `https://www.2embed.cc/embed/${imdb || id}`,
    },
    {
      name: "Server 5 (Multi)",
      url: (id, s, e, imdb) =>
        s
          ? `https://multiembed.mov/directstream.php?video_id=${imdb || id}&tmdb=1&s=${s}&e=${e}`
          : `https://multiembed.mov/directstream.php?video_id=${imdb || id}&tmdb=1`,
    },
    {
      name: "Server 6 (Super)",
      url: (id, s, e) =>
        s
          ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
          : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    },
    {
      name: "Server 7 (VidSrc ME)",
      url: (id, s, e, imdb) =>
        s
          ? `https://vidsrc.me/embed/tv?${imdb ? "imdb=" + imdb : "tmdb=" + id}&season=${s}&episode=${e}`
          : `https://vidsrc.me/embed/movie?${imdb ? "imdb=" + imdb : "tmdb=" + id}`,
    },
    {
      name: "Server 8 (Smashy)",
      url: (id, s, e, imdb) =>
        s
          ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`
          : `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    },
  ];

  static getServers() {
    return this.SERVERS;
  }

  static getStreamUrl(serverIndex, movieId, season, episode, imdbId, title) {
    const index =
      serverIndex >= 0 && serverIndex < this.SERVERS.length ? serverIndex : 0;
    const server = this.SERVERS[index];

    // Fallback logic could be added here in the future
    return server.url(movieId, season, episode, imdbId, title);
  }
}
