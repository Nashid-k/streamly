"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetmirrorAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
class NetmirrorAdapter extends base_adapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.name = "netmirror";
        this.index = 4;
    }
    async resolve(tmdbId, type, season, episode) {
        try {
            const baseUrl = "https://net52.cc";
            const embedUrl = type === "movie"
                ? `${baseUrl}/e/movie/${tmdbId}`
                : `${baseUrl}/e/tv/${tmdbId}/${season}/${episode}`;
            const html = await this.fetchHtml(embedUrl);
            const timeMatch = html.match(/data-time="([^"]+)"/);
            const hashMatch = html.match(/data-h="([^"]+)"/);
            const titleMatch = html.match(/data-title="([^"]+)"/);
            const videoIdMatch = html.match(/playerstart\("([^"]+)"\)/);
            if (!timeMatch || !hashMatch || !videoIdMatch) {
                console.error("Netmirror: Failed to extract tokens from HTML");
                return null;
            }
            const time = timeMatch[1];
            const hash = hashMatch[1];
            const title = titleMatch ? encodeURIComponent(titleMatch[1]) : "";
            const videoId = videoIdMatch[1];
            const playlistUrl = `${baseUrl}/playlist.php?id=${videoId}&t=${title}&tm=${time}&h=${hash}`;
            const res = await fetch(playlistUrl, {
                headers: {
                    "User-Agent": this.userAgent,
                    Referer: embedUrl,
                    Accept: "application/json",
                },
            });
            if (!res.ok)
                return null;
            const playlistData = await res.json();
            let m3u8Url = "";
            if (Array.isArray(playlistData) && playlistData.length > 0) {
                const item = playlistData[0];
                if (item.sources && item.sources.length > 0) {
                    m3u8Url = item.sources[0].file;
                }
            }
            if (m3u8Url) {
                return {
                    manifestUrl: m3u8Url,
                    type: "hls",
                    headers: {
                        "User-Agent": this.userAgent,
                        Referer: baseUrl,
                    },
                    referer: baseUrl,
                    expiresAt: Date.now() + 60 * 60 * 1000,
                    serverName: this.name,
                    serverIndex: this.index,
                };
            }
            return null;
        }
        catch (e) {
            console.error("Netmirror adapter failed:", e);
            return null;
        }
    }
}
exports.NetmirrorAdapter = NetmirrorAdapter;
//# sourceMappingURL=netmirror.adapter.js.map