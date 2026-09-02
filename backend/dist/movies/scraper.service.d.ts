import { Cache } from 'cache-manager';
export interface ScrapeResult {
    streamUrl: string;
    rawStreamUrl: string;
    referer?: string;
    origin?: string;
    subtitles: {
        lang: string;
        url: string;
    }[];
}
export declare class ScraperService {
    private cacheManager;
    private readonly logger;
    constructor(cacheManager: Cache);
    scrape(tmdbId: string, season?: number, episode?: number, customUrl?: string): Promise<ScrapeResult>;
}
