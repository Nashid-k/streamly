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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
function extractToken(authorization) {
    if (!authorization)
        return null;
    const [scheme, token] = authorization.split(" ");
    return scheme === "Bearer" && token ? token : null;
}
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async getMe(authorization) {
        const token = extractToken(authorization);
        if (!token)
            throw new common_1.UnauthorizedException("No token provided.");
        const decoded = await this.authService.verifyToken(token);
        return this.authService.getProfile(decoded.uid);
    }
    async getMyList(authorization) {
        const token = extractToken(authorization);
        if (!token)
            return [];
        try {
            const decoded = await this.authService.verifyToken(token);
            return this.authService.getMyList(decoded.uid);
        }
        catch {
            return [];
        }
    }
    async toggleMyList(authorization, movie) {
        const token = extractToken(authorization);
        if (!token)
            throw new common_1.UnauthorizedException("Authentication required.");
        const decoded = await this.authService.verifyToken(token);
        return this.authService.toggleMyList(decoded.uid, movie);
    }
    async getContinueWatching(authorization) {
        const token = extractToken(authorization);
        if (!token)
            return [];
        try {
            const decoded = await this.authService.verifyToken(token);
            return this.authService.getContinueWatching(decoded.uid);
        }
        catch {
            return [];
        }
    }
    async updateContinueWatching(authorization, item) {
        const token = extractToken(authorization);
        if (!token)
            throw new common_1.UnauthorizedException("Authentication required.");
        const decoded = await this.authService.verifyToken(token);
        return this.authService.updateContinueWatching(decoded.uid, item);
    }
    async removeContinueWatching(authorization, movieId) {
        const token = extractToken(authorization);
        if (!token)
            throw new common_1.UnauthorizedException("Authentication required.");
        const decoded = await this.authService.verifyToken(token);
        return this.authService.removeContinueWatching(decoded.uid, movieId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)("me"),
    __param(0, (0, common_1.Headers)("authorization")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)("mylist"),
    __param(0, (0, common_1.Headers)("authorization")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMyList", null);
__decorate([
    (0, common_1.Post)("mylist/toggle"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)("authorization")),
    __param(1, (0, common_1.Body)("movie")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "toggleMyList", null);
__decorate([
    (0, common_1.Get)("continue-watching"),
    __param(0, (0, common_1.Headers)("authorization")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getContinueWatching", null);
__decorate([
    (0, common_1.Post)("continue-watching"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)("authorization")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateContinueWatching", null);
__decorate([
    (0, common_1.Delete)("continue-watching/:movieId"),
    __param(0, (0, common_1.Headers)("authorization")),
    __param(1, (0, common_1.Param)("movieId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "removeContinueWatching", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("api/auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map