export class VideoSourceAdapter {
  static SERVERS = [
    {
      name: "Server 1",
      url: (id, s, e) =>
        s
          ? `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}&color=%230A84FF&autoplay=true&autoskip=false&autonext=false`
          : `https://cinesrc.st/embed/movie/${id}?color=%230A84FF&autoplay=true`,
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

  static getServers() {
    return this.SERVERS;
  }

  static getStreamUrl(serverIndex, movieId, season, episode, imdbId) {
    const index =
      serverIndex >= 0 && serverIndex < this.SERVERS.length ? serverIndex : 0;
    const server = this.SERVERS[index];

    return server.url(movieId, season, episode, imdbId);
  }
}
