"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const extensions_1 = require("@consumet/extensions");
const PROXY_BASE = process.env.BACKEND_URL || 'http://localhost:4000';
let ScraperService = ScraperService_1 = class ScraperService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(ScraperService_1.name);
    }
    async scrape(tmdbId, season, episode, customUrl) {
        const cacheKey = `scrape_${tmdbId}_${season || ''}_${episode || ''}_${customUrl || ''}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.log(`Returning cached stream for ${cacheKey}`);
            return cached;
        }
        const isTv = season !== undefined && episode !== undefined;
        let targetUrl = customUrl;
        if (!targetUrl) {
            targetUrl = isTv
                ? `https://2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
                : `https://2embed.cc/embed/${tmdbId}`;
        }
        this.logger.log(`Scraping via Consumet: ${targetUrl}`);
        try {
            const tmdb = new extensions_1.META.TMDB();
            const flixhq = new extensions_1.MOVIES.FlixHQ();
            const type = isTv ? 'tv' : 'movie';
            const info = await tmdb.fetchMediaInfo(tmdbId, type);
            if (info && info.title) {
                const titleStr = typeof info.title === 'string'
                    ? info.title
                    : info.title.english || info.title.romaji || info.title.native;
                this.logger.log(`Consumet fast-path: Found TMDB title "${titleStr}"`);
                const searchRes = await flixhq.search(titleStr);
                if (searchRes.results && searchRes.results.length > 0) {
                    const firstResult = searchRes.results[0];
                    const mediaInfo = await flixhq.fetchMediaInfo(firstResult.id);
                    let episodeId = mediaInfo.episodes?.[0]?.id;
                    if (isTv && mediaInfo.episodes) {
                        const matched = mediaInfo.episodes.find((e) => e.season === season && e.number === episode);
                        if (matched)
                            episodeId = matched.id;
                    }
                    if (episodeId) {
                        const sources = await flixhq.fetchEpisodeSources(episodeId, mediaInfo.id);
                        const bestSource = sources.sources?.find((s) => s.quality === 'auto') || sources.sources?.[0];
                        if (bestSource && bestSource.url) {
                            const rawStreamUrl = bestSource.url;
                            let proxiedUrl = `${PROXY_BASE}/api/movies/proxy/manifest?url=${encodeURIComponent(rawStreamUrl)}`;
                            if (sources.headers?.Referer)
                                proxiedUrl += `&ref=${encodeURIComponent(sources.headers.Referer)}`;
                            const result = {
                                streamUrl: proxiedUrl,
                                rawStreamUrl,
                                referer: sources.headers?.Referer || '',
                                origin: sources.headers?.Origin || '',
                                subtitles: (sources.subtitles || []).map((s) => ({ lang: s.lang || 'Unknown', url: s.url })),
                            };
                            await this.cacheManager.set(cacheKey, result);
                            this.logger.log(`Consumet SUCCESS: ${rawStreamUrl}`);
                            return result;
                        }
                    }
                }
            }
        }
        catch (e) {
            this.logger.warn(`Consumet scraping failed: ${e.message}`);
        }
        throw new Error('Failed to scrape stream URL without Puppeteer fallback.');
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], ScraperService);
//# sourceMappingURL=scraper.service.js.map