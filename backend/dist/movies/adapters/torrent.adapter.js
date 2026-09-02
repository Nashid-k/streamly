"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TorrentAdapter = void 0;
class TorrentAdapter {
    constructor() {
        this.name = 'local-torrent';
        this.index = 6;
    }
    async resolve(tmdbId, type, season, episode) {
        try {
            if (type !== 'movie')
                return null;
            const tmdbKey = process.env.TMDB_API_KEY;
            if (!tmdbKey)
                return null;
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbKey}`);
            if (!tmdbRes.ok)
                return null;
            const movieData = await tmdbRes.json();
            const title = movieData.title;
            const year = movieData.release_date ? movieData.release_date.split('-')[0] : '';
            if (!title)
                return null;
            const streamUrl = `/stream?title=${encodeURIComponent(title)}&year=${year}`;
            return {
                manifestUrl: streamUrl,
                type: 'mp4',
                headers: {},
                referer: '',
                expiresAt: Date.now() + 60 * 60 * 1000,
                serverName: this.name,
                serverIndex: this.index
            };
        }
        catch (e) {
            return null;
        }
    }
}
exports.TorrentAdapter = TorrentAdapter;
//# sourceMappingURL=torrent.adapter.js.map