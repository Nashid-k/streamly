"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiembedAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
class MultiembedAdapter extends base_adapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.name = 'multiembed.mov';
        this.index = 4;
    }
    async resolve(tmdbId, type, season, episode) {
        try {
            const baseUrl = 'https://multiembed.mov';
            const embedUrl = type === 'movie'
                ? `${baseUrl}/directstream.php?video_id=${tmdbId}&tmdb=1`
                : `${baseUrl}/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
            let resUrl = embedUrl;
            try {
                const headRes = await fetch(embedUrl, {
                    method: 'GET',
                    redirect: 'follow',
                    headers: { 'User-Agent': this.userAgent, 'Referer': baseUrl },
                    signal: AbortSignal.timeout(10000)
                });
                resUrl = headRes.url;
            }
            catch (e) { }
            const html = await this.fetchHtml(resUrl, baseUrl);
            let m3u8 = this.extractM3u8(html);
            if (!m3u8) {
                const jwMatch = html.match(/jwplayer\([^)]*\)\.setup\(\s*\{\s*[^}]*file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
                if (jwMatch)
                    m3u8 = jwMatch[1];
            }
            if (!m3u8) {
                const sourceMatch = html.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
                if (sourceMatch)
                    m3u8 = sourceMatch[1];
            }
            if (m3u8) {
                return {
                    manifestUrl: this.resolveUrl(m3u8, new URL(resUrl).origin),
                    type: 'hls',
                    headers: {
                        'User-Agent': this.userAgent,
                        'Referer': new URL(resUrl).origin,
                    },
                    referer: new URL(resUrl).origin,
                    expiresAt: Date.now() + 15 * 60 * 1000,
                    serverName: this.name,
                    serverIndex: this.index,
                };
            }
            return null;
        }
        catch (e) {
            return null;
        }
    }
}
exports.MultiembedAdapter = MultiembedAdapter;
//# sourceMappingURL=multiembed.adapter.js.map