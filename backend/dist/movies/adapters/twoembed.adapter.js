"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoEmbedAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
class TwoEmbedAdapter extends base_adapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.name = "2embed.cc";
        this.index = 3;
    }
    async resolve(tmdbId, type, season, episode) {
        try {
            const baseUrl = "https://www.2embed.cc";
            const embedUrl = type === "movie"
                ? `${baseUrl}/embed/${tmdbId}`
                : `${baseUrl}/embedtv/${tmdbId}&s=${season}&e=${episode}`;
            let currentHtml = await this.fetchHtml(embedUrl);
            let currentUrl = embedUrl;
            for (let i = 0; i < 3; i++) {
                const iframeMatch = currentHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                if (iframeMatch) {
                    const nextUrl = iframeMatch[1].startsWith("http")
                        ? iframeMatch[1]
                        : this.resolveUrl(iframeMatch[1], currentUrl);
                    currentHtml = await this.fetchHtml(nextUrl, currentUrl);
                    currentUrl = nextUrl;
                }
                else {
                    break;
                }
            }
            const m3u8 = this.extractM3u8(currentHtml);
            if (m3u8) {
                return {
                    manifestUrl: this.resolveUrl(m3u8, currentUrl),
                    type: "hls",
                    headers: {
                        "User-Agent": this.userAgent,
                        Referer: new URL(currentUrl).origin,
                    },
                    referer: new URL(currentUrl).origin,
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
exports.TwoEmbedAdapter = TwoEmbedAdapter;
//# sourceMappingURL=twoembed.adapter.js.map