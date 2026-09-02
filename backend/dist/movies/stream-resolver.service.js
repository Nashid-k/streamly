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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamResolverService = void 0;
const common_1 = require("@nestjs/common");
const vidlink_adapter_1 = require("./adapters/vidlink.adapter");
const vidsrc_xyz_adapter_1 = require("./adapters/vidsrc-xyz.adapter");
const embed_su_adapter_1 = require("./adapters/embed-su.adapter");
const vidsrc_in_adapter_1 = require("./adapters/vidsrc-in.adapter");
const twoembed_adapter_1 = require("./adapters/twoembed.adapter");
const netmirror_adapter_1 = require("./adapters/netmirror.adapter");
let StreamResolverService = class StreamResolverService {
    constructor() {
        this.adapters = [];
        this.cache = new Map();
        this.adapters = [
            new netmirror_adapter_1.NetmirrorAdapter(),
            new vidlink_adapter_1.VidlinkAdapter(),
            new vidsrc_xyz_adapter_1.VidsrcXyzAdapter(),
            new twoembed_adapter_1.TwoEmbedAdapter(),
            new vidsrc_in_adapter_1.VidsrcInAdapter(),
            new embed_su_adapter_1.EmbedSuAdapter(),
        ].sort((a, b) => a.index - b.index);
    }
    async resolve(tmdbId, type, season, episode, preferredServerIndex) {
        const cacheKey = `${tmdbId}-${type}-${season}-${episode}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached;
        }
        let adaptersToTry = [...this.adapters];
        if (preferredServerIndex !== undefined) {
            const prefIndex = adaptersToTry.findIndex((a) => a.index === preferredServerIndex);
            if (prefIndex !== -1) {
                const pref = adaptersToTry.splice(prefIndex, 1)[0];
                adaptersToTry.unshift(pref);
            }
        }
        for (const adapter of adaptersToTry) {
            try {
                const result = await Promise.race([
                    adapter.resolve(tmdbId, type, season, episode),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 12000)),
                ]);
                if (result) {
                    if (result.type === "hls" || result.type === "mp4") {
                        result.manifestUrl = `/api/stream/proxy?url=${encodeURIComponent(result.manifestUrl)}&ref=${encodeURIComponent(result.referer)}`;
                    }
                    this.cache.set(cacheKey, result);
                    return result;
                }
            }
            catch (e) {
                continue;
            }
        }
        throw new common_1.HttpException("No streams available", common_1.HttpStatus.SERVICE_UNAVAILABLE);
    }
};
exports.StreamResolverService = StreamResolverService;
exports.StreamResolverService = StreamResolverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StreamResolverService);
//# sourceMappingURL=stream-resolver.service.js.map