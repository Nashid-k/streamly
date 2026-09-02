export declare class TmdbAdapter {
    private readonly baseUrl;
    private readonly fallbackBaseUrls;
    private readonly apiKey;
    private readonly readToken;
    private readonly language;
    private readonly region;
    private readonly requestTimeoutMs;
    constructor(baseUrl: string, fallbackBaseUrls: string[], apiKey: string, readToken: string, language?: string, region?: string, requestTimeoutMs?: number);
    private isConfigured;
    private ensureConfigured;
    get(path: string, params?: Record<string, string>): Promise<any>;
}
