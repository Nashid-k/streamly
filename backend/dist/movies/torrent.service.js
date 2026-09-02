"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TorrentService = void 0;
const common_1 = require("@nestjs/common");
let TorrentService = class TorrentService {
    async getMagnetForMovie(title, year) {
        try {
            const query = encodeURIComponent(`${title} ${year} 1080p multi`);
            const response = await fetch(`https://apibay.org/q.php?q=${query}`);
            const data = await response.json();
            if (data &&
                data.length > 0 &&
                data[0].info_hash &&
                data[0].info_hash !== "0000000000000000000000000000000000000000") {
                const hash = data[0].info_hash;
                return `magnet:?xt=urn:btih:${hash}&tr=udp://tracker.opentrackr.org:1337/announce`;
            }
            const fbQuery = encodeURIComponent(`${title} ${year} 1080p`);
            const fbResponse = await fetch(`https://apibay.org/q.php?q=${fbQuery}`);
            const fbData = await fbResponse.json();
            if (fbData &&
                fbData.length > 0 &&
                fbData[0].info_hash &&
                fbData[0].info_hash !== "0000000000000000000000000000000000000000") {
                const hash = fbData[0].info_hash;
                return `magnet:?xt=urn:btih:${hash}&tr=udp://tracker.opentrackr.org:1337/announce`;
            }
            return null;
        }
        catch (e) {
            console.error("Failed to fetch torrent", e);
            return null;
        }
    }
};
exports.TorrentService = TorrentService;
exports.TorrentService = TorrentService = __decorate([
    (0, common_1.Injectable)()
], TorrentService);
//# sourceMappingURL=torrent.service.js.map