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
var StreamController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamController = void 0;
const common_1 = require("@nestjs/common");
const firebase_auth_guard_1 = require("../auth/firebase-auth.guard");
const torrentStream = require("torrent-stream");
let StreamController = StreamController_1 = class StreamController {
    constructor() {
        this.logger = new common_1.Logger(StreamController_1.name);
        this.engines = new Map();
        this.ENGINE_TTL_MS = 30 * 60 * 1000;
    }
    destroyEngine(magnet) {
        const entry = this.engines.get(magnet);
        if (entry) {
            clearTimeout(entry.timer);
            try {
                entry.engine.destroy();
            }
            catch { }
            this.engines.delete(magnet);
            this.logger.log(`Engine destroyed for magnet: ${magnet.slice(0, 40)}...`);
        }
    }
    getOrCreateEngine(magnet) {
        const existing = this.engines.get(magnet);
        if (existing) {
            clearTimeout(existing.timer);
            existing.timer = setTimeout(() => this.destroyEngine(magnet), this.ENGINE_TTL_MS);
            existing.lastAccessed = Date.now();
            return existing.engine;
        }
        const engine = torrentStream(magnet, {
            connections: 15,
            uploads: 3,
            path: "/tmp/torrent-stream",
            verify: true,
            trackers: [
                "udp://tracker.openbittorrent.com:80",
                "udp://tracker.opentrackr.org:1337",
                "udp://tracker.leechers-paradise.org:6969",
                "udp://tracker.coppersurfer.tk:6969",
            ],
        });
        const timer = setTimeout(() => this.destroyEngine(magnet), this.ENGINE_TTL_MS);
        this.engines.set(magnet, { engine, lastAccessed: Date.now(), timer });
        return engine;
    }
    async streamTorrent(magnet, title, year, req, res) {
        if (!magnet && (!title || !year)) {
            throw new common_1.HttpException("Magnet link or title+year is required", common_1.HttpStatus.BAD_REQUEST);
        }
        if (!magnet && title && year) {
            try {
                const query = encodeURIComponent(`${title} ${year}`);
                const response = await fetch(`https://apibay.org/q.php?q=${query}`);
                let data = await response.json();
                if (data &&
                    data.length > 0 &&
                    data[0].info_hash &&
                    data[0].info_hash !== "0000000000000000000000000000000000000000") {
                    data = data.filter((d) => d.info_hash !== "0000000000000000000000000000000000000000");
                    data.sort((a, b) => parseInt(b.seeders) - parseInt(a.seeders));
                    const hash = data[0].info_hash;
                    magnet = `magnet:?xt=urn:btih:${hash}&tr=udp://tracker.opentrackr.org:1337/announce`;
                }
                else {
                    throw new common_1.HttpException("No torrent found for this movie", common_1.HttpStatus.NOT_FOUND);
                }
            }
            catch (e) {
                if (e instanceof common_1.HttpException)
                    throw e;
                throw new common_1.HttpException("Failed to search for torrent", common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        this.logger.log(`Streaming torrent for: ${magnet.slice(0, 60)}...`);
        const engine = this.getOrCreateEngine(magnet);
        if (!engine.torrent) {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.destroyEngine(magnet);
                    reject(new common_1.HttpException("Timeout: Could not fetch torrent metadata. No seeders found.", common_1.HttpStatus.GATEWAY_TIMEOUT));
                }, 15000);
                engine.on("ready", () => {
                    clearTimeout(timeout);
                    resolve(true);
                });
            });
        }
        const file = engine.files.reduce((a, b) => a.length > b.length ? a : b);
        if (!file) {
            throw new common_1.HttpException("No suitable file found in torrent", common_1.HttpStatus.NOT_FOUND);
        }
        const fileSize = file.length;
        const range = req.headers.range;
        const ext = file.name.split(".").pop()?.toLowerCase();
        let contentType = "video/mp4";
        if (ext === "mkv")
            contentType = "video/x-matroska";
        if (ext === "webm")
            contentType = "video/webm";
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const stream = file.createReadStream({ start, end });
            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": contentType,
            });
            stream.pipe(res);
        }
        else {
            res.writeHead(200, {
                "Content-Length": fileSize,
                "Content-Type": contentType,
            });
            file.createReadStream().pipe(res);
        }
        req.on("close", () => {
            this.logger.log(`Client disconnected from torrent stream`);
            // Cleanup: destroy engine after client disconnects to free disk space
            setTimeout(() => {
                try { engine.destroy(); } catch {}
            }, 30000); // 30s grace period for potential reconnection
        });
    }
};
exports.StreamController = StreamController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Query)("magnet")),
    __param(1, (0, common_1.Query)("title")),
    __param(2, (0, common_1.Query)("year")),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "streamTorrent", null);
exports.StreamController = StreamController = StreamController_1 = __decorate([
    (0, common_1.Controller)("stream")
], StreamController);
//# sourceMappingURL=stream.controller.js.map