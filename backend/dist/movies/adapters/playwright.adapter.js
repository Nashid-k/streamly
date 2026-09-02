"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
let chromium;
try {
    chromium = require('playwright').chromium;
}
catch { }
class PlaywrightAdapter extends base_adapter_1.BaseAdapter {
    constructor(targetBaseUrl) {
        super();
        this.name = 'playwright-fallback';
        this.index = 99;
        this.targetBaseUrl = targetBaseUrl;
    }
    async resolve(tmdbId, type, season, episode) {
        if (!chromium)
            return null;
        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                userAgent: this.userAgent,
                extraHTTPHeaders: { 'Referer': this.targetBaseUrl }
            });
            const page = await context.newPage();
            let m3u8Url = '';
            page.on('request', (request) => {
                const url = request.url();
                if (url.includes('.m3u8')) {
                    m3u8Url = url;
                }
            });
            const url = type === 'movie'
                ? `${this.targetBaseUrl}/embed/movie?tmdb=${tmdbId}`
                : `${this.targetBaseUrl}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
            try {
                await page.click('button, .play-button, #play', { timeout: 3000 });
            }
            catch (e) { }
            for (let i = 0; i < 8; i++) {
                if (m3u8Url)
                    break;
                await new Promise(r => setTimeout(r, 1000));
            }
            if (m3u8Url) {
                return {
                    manifestUrl: m3u8Url,
                    type: 'hls',
                    headers: {
                        'User-Agent': this.userAgent,
                        'Referer': this.targetBaseUrl,
                    },
                    referer: this.targetBaseUrl,
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
        finally {
            if (browser)
                await browser.close();
        }
    }
}
exports.PlaywrightAdapter = PlaywrightAdapter;
//# sourceMappingURL=playwright.adapter.js.map