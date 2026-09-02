"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TmdbAdapter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
class TmdbAdapter {
    constructor(baseUrl, fallbackBaseUrls, apiKey, readToken, language = "en-US", region = "US", requestTimeoutMs = 5000) {
        this.baseUrl = baseUrl;
        this.fallbackBaseUrls = fallbackBaseUrls;
        this.apiKey = apiKey;
        this.readToken = readToken;
        this.language = language;
        this.region = region;
        this.requestTimeoutMs = requestTimeoutMs;
    }
    isConfigured() {
        return Boolean(this.readToken || this.apiKey);
    }
    ensureConfigured() {
        if (!this.isConfigured()) {
            throw new common_1.ServiceUnavailableException("TMDB credentials are not configured.");
        }
    }
    async get(path, params = {}) {
        this.ensureConfigured();
        const query = new URLSearchParams({ language: this.language, ...params });
        if (this.region)
            query.set("region", this.region);
        if (!this.readToken && this.apiKey)
            query.set("api_key", this.apiKey);
        const baseUrls = Array.from(new Set([this.baseUrl, ...this.fallbackBaseUrls]));
        let lastError;
        for (const base of baseUrls) {
            try {
                const url = new URL(`${base}/${path}`);
                for (const [key, value] of query)
                    url.searchParams.set(key, value);
                const response = await (0, axios_1.default)({
                    url: url.toString(),
                    method: "GET",
                    headers: this.readToken
                        ? {
                            Authorization: `Bearer ${this.readToken}`,
                            Accept: "application/json",
                        }
                        : { Accept: "application/json" },
                    timeout: this.requestTimeoutMs,
                });
                return response.data;
            }
            catch (err) {
                lastError = err;
            }
        }
        throw lastError || new Error(`TMDB ${path} failed on all endpoints.`);
    }
}
exports.TmdbAdapter = TmdbAdapter;
//# sourceMappingURL=tmdb.adapter.js.map