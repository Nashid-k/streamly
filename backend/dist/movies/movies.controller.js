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
exports.MoviesController = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const movies_service_1 = require("./movies.service");
function setCache(res, maxAgeSeconds, staleWhileRevalidateSeconds = 60) {
    res.setHeader("Cache-Control", `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`);
}
let MoviesController = class MoviesController {
    constructor(moviesService) {
        this.moviesService = moviesService;
    }
    async getAllMovies(res, platform = "netflix") {
        setCache(res, 120);
        return this.moviesService.getAllMovies(platform);
    }
    async getFeatured(res, platform = "netflix") {
        setCache(res, 120);
        if (platform === "all")
            return this.moviesService.getAllFeaturedMovies();
        return this.moviesService.getFeaturedMovie(platform);
    }
    async getCategories(res, platform = "netflix") {
        setCache(res, 120);
        return this.moviesService.getCategories(platform);
    }
    async getTop10(res, platform = "netflix") {
        setCache(res, 120);
        return this.moviesService.getTop10Movies(platform);
    }
    async searchMovies(res, query, genre, platform = "netflix") {
        res.setHeader("Cache-Control", "public, max-age=3600");
        const safeQuery = (query || "").slice(0, 200);
        const result = await this.moviesService.searchMovies(safeQuery, genre, platform);
        return result;
    }
    async getAiring(res, platform = "all") {
        setCache(res, 300);
        return this.moviesService.getAiringThisWeek(platform);
    }
    async getTrending(res, platform = "all") {
        setCache(res, 300);
        return this.moviesService.getTrendingThisWeek(platform);
    }
    async getPerson(res, personId) {
        setCache(res, 86400);
        return this.moviesService.getPersonDetails(personId);
    }
    async getStreamUrl(res, id, server, season, episode, platform = "netflix") {
        setCache(res, 3600);
        return this.moviesService.getStreamUrl(id, server ? parseInt(server, 10) : 0, season ? parseInt(season, 10) : undefined, episode ? parseInt(episode, 10) : undefined, platform);
    }
    async getMovieById(res, id, platform = "netflix") {
        setCache(res, 86400);
        return this.moviesService.getMovieById(id, platform);
    }
    async getSimilar(res, id, platform = "netflix") {
        const validPlatforms = [
            "netflix",
            "prime",
            "hotstar",
            "appletv",
            "zee5",
            "sonyliv",
            "jio",
        ];
        if (!validPlatforms.includes(platform))
            platform = "netflix";
        setCache(res, 86400);
        return this.moviesService.getSimilarMovies(id, platform);
    }
    async getSeasonEpisodes(res, id, seasonNumber, platform = "netflix") {
        setCache(res, 86400);
        const season = Math.min(Math.max(Number.parseInt(seasonNumber, 10) || 1, 1), 50);
        const episodes = await this.moviesService.getSeasonEpisodes(id, season, platform);
        const list = Array.isArray(episodes) ? episodes : [];
        const now = Date.now();
        const released = list.filter((ep) => {
            if (!ep.airDate) return true;
            const t = Date.parse(ep.airDate);
            return isNaN(t) ? true : t <= now;
        });
        res.setHeader("x-total-episodes", String(list.length));
        res.setHeader("x-released-episodes", String(released.length));
        res.setHeader("x-is-airing", String(released.length > 0 && released.length < list.length));
        return list;
    }
    async getRecommendations(res, id, platform = "netflix") {
        setCache(res, 300);
        return this.moviesService.getRecommendations(id, platform);
    }
    async getIntroTimings(res, id, season, episode, platform = "netflix") {
        setCache(res, 86400);
        const s = season ? parseInt(season, 10) : undefined;
        const e = episode ? parseInt(episode, 10) : undefined;
        return this.moviesService.getIntroTimings(id, s, e, platform);
    }
    async getExternalIds(res, id, platform = "netflix") {
        setCache(res, 86400);
        return this.moviesService.getExternalIds(id, platform);
    }
};
exports.MoviesController = MoviesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getAllMovies", null);
__decorate([
    (0, common_1.Get)("featured"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getFeatured", null);
__decorate([
    (0, common_1.Get)("categories"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)("top10"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getTop10", null);
__decorate([
    (0, common_1.Get)("search"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Query)("q")),
    __param(2, (0, common_1.Query)("genre")),
    __param(3, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "searchMovies", null);
__decorate([
    (0, common_1.Get)("airing"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getAiring", null);
__decorate([
    (0, common_1.Get)("trending"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getTrending", null);
__decorate([
    (0, common_1.Get)("person/:personId"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("personId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getPerson", null);
__decorate([
    (0, common_1.Get)(":id/stream-url"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("server")),
    __param(3, (0, common_1.Query)("season")),
    __param(4, (0, common_1.Query)("episode")),
    __param(5, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getStreamUrl", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getMovieById", null);
__decorate([
    (0, common_1.Get)(":id/similar"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getSimilar", null);
__decorate([
    (0, common_1.Get)(":id/season/:seasonNumber"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("seasonNumber")),
    __param(3, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getSeasonEpisodes", null);
__decorate([
    (0, common_1.Get)(":id/recommendations"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)(":id/intro"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("season")),
    __param(3, (0, common_1.Query)("episode")),
    __param(4, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getIntroTimings", null);
__decorate([
    (0, common_1.Get)(":id/external_ids"),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("platform")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getExternalIds", null);
exports.MoviesController = MoviesController = __decorate([
    (0, common_1.Controller)("api/movies"),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    __metadata("design:paramtypes", [movies_service_1.MoviesService])
], MoviesController);
//# sourceMappingURL=movies.controller.js.map