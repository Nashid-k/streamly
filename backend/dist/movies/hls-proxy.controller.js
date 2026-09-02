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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HlsProxyController = void 0;
const common_1 = require("@nestjs/common");
const stream_resolver_service_1 = require("./stream-resolver.service");
let HlsProxyController = class HlsProxyController {
    constructor(streamResolver) {
        this.streamResolver = streamResolver;
    }
    async resolve(tmdbId, type, season, episode, serverIndex) {
        if (!tmdbId || !type) {
            throw new common_1.HttpException("Missing tmdbId or type", common_1.HttpStatus.BAD_REQUEST);
        }
        const parsedSeason = season ? parseInt(season, 10) : undefined;
        const parsedEpisode = episode ? parseInt(episode, 10) : undefined;
        const parsedServerIndex = serverIndex
            ? parseInt(serverIndex, 10)
            : undefined;
        const result = await this.streamResolver.resolve(tmdbId, type, parsedSeason, parsedEpisode, parsedServerIndex);
        return {
            proxyManifestUrl: result.manifestUrl,
            serverName: result.serverName,
            serverIndex: result.serverIndex,
            cached: true,
        };
    }
    async proxy(url, ref, res) {
        if (!url) {
            throw new common_1.HttpException("Missing url", common_1.HttpStatus.BAD_REQUEST);
        }
        // SSRF protection: validate the URL before fetching
        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                throw new common_1.HttpException('Only HTTP/HTTPS URLs allowed', common_1.HttpStatus.BAD_REQUEST);
            }
            const blocked = ['localhost', '127.0.0.1', '[::1]', '169.254.169.254'];
            if (blocked.includes(parsed.hostname) || /^10\./.test(parsed.hostname) || /^192\.168\./.test(parsed.hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(parsed.hostname)) {
                throw new common_1.HttpException('Internal/private URLs not allowed', common_1.HttpStatus.FORBIDDEN);
            }
        } catch (e) {
            if (e instanceof common_1.HttpException) throw e;
            throw new common_1.HttpException('Invalid URL', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const upstreamRes = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Referer: ref || "",
                },
            });
            if (!upstreamRes.ok) {
                throw new common_1.HttpException("Upstream error", upstreamRes.status);
            }
            const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Content-Type", contentType);
            if (url.includes(".m3u8") || contentType.includes("mpegurl")) {
                let text = await upstreamRes.text();
                const baseUrl = new URL(url);
                const lines = text.split("\n");
                const rewrittenLines = lines.map((line) => {
                    line = line.trim();
                    if (line && !line.startsWith("#")) {
                        let absoluteUrl = line;
                        if (!line.startsWith("http")) {
                            absoluteUrl = new URL(line, baseUrl.href).href;
                        }
                        return `/api/stream/proxy?url=${encodeURIComponent(absoluteUrl)}&ref=${encodeURIComponent(ref)}`;
                    }
                    if (line.startsWith("#EXT-X-KEY")) {
                        return line.replace(/URI="([^"]+)"/, (match, keyUrl) => {
                            let absoluteKeyUrl = keyUrl;
                            if (!keyUrl.startsWith("http")) {
                                absoluteKeyUrl = new URL(keyUrl, baseUrl.href).href;
                            }
                            return `URI="/api/stream/proxy?url=${encodeURIComponent(absoluteKeyUrl)}&ref=${encodeURIComponent(ref)}"`;
                        });
                    }
                    return line;
                });
                res.send(rewrittenLines.join("\n"));
            }
            else {
                if (upstreamRes.body) {
                    const { Readable } = require("stream");
                    const readable = Readable.fromWeb(upstreamRes.body);
                    readable.pipe(res);
                }
                else {
                    const arrayBuf = await upstreamRes.arrayBuffer();
                    res.send(Buffer.from(arrayBuf));
                }
            }
        }
        catch (error) {
            res.status(500).send("Proxy error");
        }
    }
};
exports.HlsProxyController = HlsProxyController;
__decorate([
    (0, common_1.Get)("resolve"),
    __param(0, (0, common_1.Query)("tmdbId")),
    __param(1, (0, common_1.Query)("type")),
    __param(2, (0, common_1.Query)("season")),
    __param(3, (0, common_1.Query)("episode")),
    __param(4, (0, common_1.Query)("serverIndex")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], HlsProxyController.prototype, "resolve", null);
__decorate([
    (0, common_1.Get)("proxy"),
    __param(0, (0, common_1.Query)("url")),
    __param(1, (0, common_1.Query)("ref")),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], HlsProxyController.prototype, "proxy", null);
exports.HlsProxyController = HlsProxyController = __decorate([
    (0, common_1.Controller)("api/stream"),
    __metadata("design:paramtypes", [stream_resolver_service_1.StreamResolverService])
], HlsProxyController);
//# sourceMappingURL=hls-proxy.controller.js.map