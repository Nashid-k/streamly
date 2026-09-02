"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_PLATFORMS = exports.PLATFORM_LABELS = exports.PlatformState = void 0;
class PlatformState {
    constructor() {
        this.movies = new Map();
        this.tmdbIdIndex = new Map();
        this.titleIndex = new Map();
        this.genreIndex = new Map();
        this.categories = [];
        this.realRecentlyAddedTmdbIds = new Set();
        this.realLeavingSoonTmdbIds = new Set();
        this.lastRefreshAttemptAt = 0;
        this.refreshInFlight = null;
        this.searchCache = new Map();
    }
}
exports.PlatformState = PlatformState;
exports.PLATFORM_LABELS = {
    netflix: "Netflix",
    prime: "Prime Video",
    hotstar: "Hotstar",
    appletv: "Apple TV+",
    zee5: "Zee5",
    sonyliv: "Sony LIV",
    jio: "JioCinema",
};
exports.ALL_PLATFORMS = [
    "netflix",
    "prime",
    "hotstar",
    "appletv",
    "zee5",
    "sonyliv",
    "jio",
];
//# sourceMappingURL=platform-state.js.map