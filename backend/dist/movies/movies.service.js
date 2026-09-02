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
var MoviesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const tmdb_adapter_1 = require("./adapters/tmdb.adapter");
const rapidapi_adapter_1 = require("./adapters/rapidapi.adapter");
const push_notification_adapter_1 = require("./adapters/push-notification.adapter");
const platform_state_1 = require("./platform-state");
const LANGUAGE_NAMES = {
    bn: "Bengali",
    de: "German",
    en: "English",
    es: "Spanish",
    fr: "French",
    hi: "Hindi",
    it: "Italian",
    ja: "Japanese",
    kn: "Kannada",
    ko: "Korean",
    ml: "Malayalam",
    mr: "Marathi",
    pa: "Punjabi",
    ta: "Tamil",
    te: "Telugu",
    zh: "Mandarin",
};
let MoviesService = MoviesService_1 = class MoviesService {
    encodeUrl(url) {
        if (!url)
            return "";
        const secret = process.env.URL_ENCRYPTION_KEY;
        if (!secret) {
            this.logger.warn('URL_ENCRYPTION_KEY not set — URLs will be base64-only (not encrypted).');
            return Buffer.from(url).toString('base64');
        }
        const obfuscated = url
            .split("")
            .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length)))
            .join("");
        return Buffer.from(obfuscated).toString("base64");
    }
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(MoviesService_1.name);
        this.baseUrl = process.env.TMDB_BASE_URL || "https://api.tmdb.org/3";
        this.fallbackBaseUrls = [
            "https://api.tmdb.org/3",
            "https://api.themoviedb.org/3",
        ];
        this.imageBaseUrl = process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p";
        this.language = process.env.TMDB_LANGUAGE || "en-US";
        this.region = process.env.TMDB_REGION || "US";
        this.readToken = process.env.TMDB_READ_TOKEN;
        this.apiKey = process.env.TMDB_API_KEY || "";
        this.pagesPerRail = this.parsePositiveInt(process.env.TMDB_CATALOG_PAGES, 3, 1, 20);
        this.itemsPerRail = this.parsePositiveInt(process.env.TMDB_ITEMS_PER_RAIL, 40, 1, 400);
        this.requestTimeoutMs = this.parsePositiveInt(process.env.TMDB_REQUEST_TIMEOUT_MS, 15_000, 1_000, 60_000);
        this.refreshRetryMs = this.parsePositiveInt(process.env.TMDB_REFRESH_RETRY_MS, 15_000, 1_000, 300_000);
        this.genres = new Map();
        this.seasonEpisodesCache = new Map();
        this.state = Object.fromEntries(platform_state_1.ALL_PLATFORMS.map((p) => [p, new platform_state_1.PlatformState()]));
        this.providerMap = {
            netflix: "8",
            prime: "9",
            hotstar: "122",
            appletv: "350",
            zee5: "232",
            sonyliv: "237",
            jio: "220",
        };
    }
    async onModuleInit() {
        if (!this.isConfigured()) {
            this.logger.warn("TMDB credentials are not configured; catalog endpoints will return 503.");
            return;
        }
        try {
            this.logger.log("Setting region to IN for maximum catalog availability...");
            this.region = "IN";
        }
        catch (e) {
            this.region = "IN";
            this.logger.warn(`Could not detect location: ${e}. Using default region: ${this.region}`);
        }
        try {
            this.logger.log(`Fetching available watch providers for region ${this.region}...`);
            const providers = await this.tmdb(`watch/providers/movie`, {
                watch_region: this.region,
            });
            if (providers && providers.results) {
                const netflix = providers.results.find((p) => p.provider_name.toLowerCase().includes("netflix"));
                const prime = providers.results.find((p) => p.provider_name.toLowerCase().includes("amazon prime video"));
                const hotstar = providers.results.find((p) => p.provider_name.toLowerCase().includes("hotstar")) ||
                    providers.results.find((p) => p.provider_name.toLowerCase().includes("disney"));
                const appletv = providers.results.find((p) => p.provider_name.toLowerCase().includes("apple tv"));
                const zee5 = providers.results.find((p) => p.provider_name.toLowerCase().includes("zee5"));
                const sonyliv = providers.results.find((p) => p.provider_name.toLowerCase().includes("sonyliv"));
                const jio = providers.results.find((p) => p.provider_name.toLowerCase().includes("jio"));
                if (netflix)
                    this.providerMap["netflix"] = String(netflix.provider_id);
                if (prime)
                    this.providerMap["prime"] = String(prime.provider_id);
                if (hotstar)
                    this.providerMap["hotstar"] = String(hotstar.provider_id);
                if (appletv)
                    this.providerMap["appletv"] = String(appletv.provider_id);
                if (zee5)
                    this.providerMap["zee5"] = String(zee5.provider_id);
                if (sonyliv)
                    this.providerMap["sonyliv"] = String(sonyliv.provider_id);
                if (jio)
                    this.providerMap["jio"] = String(jio.provider_id);
            }
        }
        catch (e) {
            this.logger.warn(`Failed to dynamically map providers for region ${this.region}: ${e}`);
        }
        this.logger.log(`Using Watch Providers for Region ${this.region}: Netflix=${this.providerMap["netflix"]}, Prime=${this.providerMap["prime"]}, Hotstar=${this.providerMap["hotstar"]}`);
        // B4 fix: await catalog loads so app doesn't serve fallback data
        (async () => {
            for (const platform of platform_state_1.ALL_PLATFORMS) {
                try {
                    await this.refreshCatalog(platform);
                    this.logger.log(`Catalog loaded for ${platform}`);
                }
                catch (e) {
                    this.logger.warn(`Catalog load failed for ${platform}: ${String(e)}`);
                }
                await new Promise((r) => setTimeout(r, 2000));
            }
            this.logger.log("All platform catalogs loaded.");
        })().catch((e) => this.logger.error('Catalog init failed:', e));
    }
    parsePositiveInt(raw, fallback, min, max) {
        const value = Number.parseInt(raw || "", 10);
        return Number.isFinite(value)
            ? Math.min(Math.max(value, min), max)
            : fallback;
    }
    isConfigured() {
        return Boolean(this.readToken || this.apiKey);
    }
    ensureConfigured() {
        if (!this.isConfigured()) {
            throw new common_1.ServiceUnavailableException("TMDB catalog credentials are not configured.");
        }
    }
    async tmdb(path, params = {}) {
        const cacheKey = `tmdb:${path}:${JSON.stringify(params)}`;
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached)
                return cached;
        }
        catch (e) {
            this.logger.warn(`Redis GET failed: ${e.message}`);
        }
        if (!this.tmdbAdapter) {
            this.tmdbAdapter = new tmdb_adapter_1.TmdbAdapter(this.baseUrl, this.fallbackBaseUrls, this.apiKey, this.readToken, this.language, this.region, this.requestTimeoutMs);
        }
        const data = await this.tmdbAdapter.get(path, params);
        try {
            await this.cacheManager.set(cacheKey, data, 24 * 60 * 60 * 1000);
        }
        catch (e) {
            this.logger.warn(`Redis SET failed: ${e.message}`);
        }
        return data;
    }
    getRapidApi() {
        if (!this.rapidApiAdapter) {
            this.rapidApiAdapter = new rapidapi_adapter_1.RapidApiAdapter(process.env.RAPIDAPI_KEY, this.requestTimeoutMs);
        }
        return this.rapidApiAdapter;
    }
    async rapidApiChanges(serviceName, changeType, itemType = "show") {
        const cacheKey = `rapidapi:${serviceName}:${changeType}:${itemType}`;
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached)
                return cached;
        }
        catch (e) {
            this.logger.warn(`Redis GET failed: ${e.message}`);
        }
        const data = await this.getRapidApi().getChanges(serviceName, changeType, itemType);
        try {
            if (data)
                await this.cacheManager.set(cacheKey, data, 12 * 60 * 60 * 1000);
        }
        catch (e) {
            this.logger.warn(`Redis SET failed: ${e.message}`);
        }
        return data;
    }
    getPushNotification() {
        if (!this.pushNotificationAdapter) {
            this.pushNotificationAdapter = new push_notification_adapter_1.PushNotificationAdapter();
        }
        return this.pushNotificationAdapter;
    }
    async loadGenres() {
        try {
            const lists = await Promise.all(["movie", "tv"].map(async (type) => this.tmdb(`genre/${type}/list`).catch(() => ({ genres: [] }))));
            for (const list of lists) {
                for (const genre of list.genres || [])
                    this.genres.set(genre.id, genre.name);
            }
        }
        catch (e) {
            this.logger.warn("Failed to load genres list from TMDB:", e);
        }
    }
    async loadRealNetflixStatus(platform) {
        const state = this.state[platform];
        const rapidApiKey = process.env.RAPIDAPI_KEY;
        if (!rapidApiKey) {
            this.logger.log("RAPIDAPI_KEY not set. Using TMDB release dates for Recently Added / Leaving Soon badges.");
            return;
        }
        const serviceName = platform === "hotstar"
            ? "hotstar"
            : platform === "prime"
                ? "prime"
                : "netflix";
        try {
            const [newData, expData] = await Promise.all([
                this.rapidApiChanges(serviceName, "new", "show"),
                this.rapidApiChanges(serviceName, "expiring", "show"),
            ]);
            if (newData) {
                const newIds = Object.values(newData.shows || {})
                    .map((item) => item.tmdbId)
                    .filter(Boolean)
                    .map((id) => (id.includes("/") ? id.split("/")[1] : id));
                const oldSet = state.realRecentlyAddedTmdbIds || new Set();
                const freshIds = newIds.filter((id) => !oldSet.has(id));
                if (freshIds.length > 0 && oldSet.size > 0) {
                    const firstNewShow = Object.values(newData.shows || {}).find((s) => s.tmdbId === freshIds[0] || s.tmdbId?.includes(freshIds[0]));
                    if (firstNewShow) {
                        this.getPushNotification().broadcastNewRelease(firstNewShow.title || "A new title", platform, freshIds[0]);
                    }
                }
                state.realRecentlyAddedTmdbIds = new Set(newIds.map(String));
            }
            if (expData) {
                const expIds = Object.values(expData.shows || {})
                    .map((item) => item.tmdbId)
                    .filter(Boolean)
                    .map((id) => (id.includes("/") ? id.split("/")[1] : id));
                state.realLeavingSoonTmdbIds = new Set(expIds.map(String));
            }
            this.logger.log(`Status badges loaded for ${serviceName}: ${state.realRecentlyAddedTmdbIds.size} recently added, ${state.realLeavingSoonTmdbIds.size} leaving soon.`);
        }
        catch (e) {
            this.logger.warn(e);
        }
    }
    image(path, size = "w780") {
        return path ? `${this.imageBaseUrl}/${size}${path}` : "";
    }
    toMovie(item, mediaType) {
        const date = item.release_date || item.first_air_date || "";
        const voteCount = item.vote_count || 0;
        // Try to use actual certification from TMDB release_dates if available
        let rating = '';
        if (item.release_dates?.results) {
            const usRelease = item.release_dates.results.find(r => r.iso_3166_1 === 'US');
            const cert = usRelease?.release_dates?.find(rd => rd.certification)?.certification;
            if (cert) rating = cert;
        }
        if (!rating) {
            rating = item.adult
                ? "TV-MA"
                : voteCount > 1000
                    ? "PG-13"
                    : voteCount > 100
                        ? "PG"
                        : "NR";
        }
        let duration = "";
        if (item.runtime) {
            const h = Math.floor(item.runtime / 60);
            const m = item.runtime % 60;
            duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
        }
        else if (item.episode_run_time?.[0]) {
            duration = `${item.episode_run_time[0]}m`;
        }
        else if (date) {
            duration = date.slice(0, 4);
        }
        const tmdbIdStr = String(item.id);
        const isTV = mediaType === "tv" ||
            Boolean(item.first_air_date ||
                item.number_of_seasons ||
                item.number_of_episodes);
        const isAnime = (item.original_language === "ja" ||
            item.origin_country?.includes("JP")) &&
            (item.genre_ids || []).includes(16);
        const rawDate = item.release_date || item.first_air_date || "";
        let isUpcoming = false;
        if (rawDate) {
            const relTime = new Date(rawDate).getTime();
            if (!isNaN(relTime) && relTime > Date.now()) {
                isUpcoming = true;
            }
        }
        const logoObj = item.images?.logos?.find((l) => l.iso_639_1 === "en") ||
            item.images?.logos?.[0];
        const logoUrl = logoObj?.file_path
            ? this.image(logoObj.file_path, "w500")
            : "";
        let nextEpisode = undefined;
        if (item.next_episode_to_air) {
            nextEpisode = {
                title: item.next_episode_to_air.name ||
                    `Episode ${item.next_episode_to_air.episode_number}`,
                seasonNumber: item.next_episode_to_air.season_number,
                episodeNumber: item.next_episode_to_air.episode_number,
                releaseDate: item.next_episode_to_air.air_date,
            };
        }
        return {
            id: `tmdb-${mediaType}-${item.id}`,
            tmdbId: tmdbIdStr,
            imdbId: item.imdb_id || item.external_ids?.imdb_id,
            seasonsCount: item.number_of_seasons || undefined,
            title: item.title ||
                item.name ||
                item.original_title ||
                item.original_name ||
                "Untitled",
            originalTitle: item.original_title || item.original_name,
            description: item.overview || "",
            longDescription: item.overview || "",
            backdropUrl: this.image(item.backdrop_path, "w1280") ||
                this.image(item.poster_path, "w780"),
            posterUrl: this.image(item.poster_path, "w500"),
            logoUrl: logoUrl,
            trailerUrl: "",
            matchScore: Math.max(50, Math.round((item.vote_average || 0) * 10)),
            imdbRating: item.vote_average
                ? Number.parseFloat(Number(item.vote_average).toFixed(1))
                : 0,
            popularity: item.popularity || 0,
            releaseYear: Number.parseInt(rawDate.slice(0, 4), 10) || new Date().getFullYear(),
            releaseDate: rawDate,
            isUpcoming: isUpcoming,
            maturityRating: rating,
            duration: duration,
            isSeries: isTV,
            isAnime: isAnime,
            genres: (item.genre_ids || [])
                .map((id) => this.genres.get(id))
                .filter((name) => Boolean(name)),
            cast: [],
            director: "",
            videoUrl: "",
            tags: [],
            audioLanguages: item.original_language && LANGUAGE_NAMES[item.original_language]
                ? [LANGUAGE_NAMES[item.original_language]]
                : [],
            subtitleLanguages: [],
            nextEpisode: nextEpisode,
        };
    }
    async refreshCatalog(platform = "netflix") {
        const state = this.state[platform];
        state.searchCache.clear();
        if (state.refreshInFlight)
            return state.refreshInFlight;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Refresh Timeout")), 120000));
        state.refreshInFlight = Promise.race([
            this.loadCatalog(platform),
            timeoutPromise,
        ]).finally(() => {
            state.refreshInFlight = null;
        });
        return state.refreshInFlight;
    }
    buildDynamicRails(platform) {
        const providerId = this.providerMap[platform];
        const monetization = "flatrate";
        const region = this.region;
        const today = new Date().toISOString().split("T")[0];
        const baseDiscoverMovie = `with_watch_providers=${providerId}&watch_region=${region}`;
        const baseUpcomingMovie = `with_watch_providers=${providerId}&watch_region=${region}`;
        const baseDiscoverTv = `with_watch_providers=${providerId}&watch_region=${region}`;
        const d = new Date();
        d.setMonth(d.getMonth() - 2);
        const recentDateIso = d.toISOString().split("T")[0];
        const regionalLanguages = [
            ["hi", "Hindi"],
            ["ta", "Tamil"],
            ["te", "Telugu"],
            ["ml", "Malayalam"],
            ["kn", "Kannada"],
            ["mr", "Marathi"],
            ["bn", "Bengali"],
            ["ar", "Arabic"],
        ];
        const regionalRails = regionalLanguages.flatMap(([code, name]) => [
            {
                id: `${code}-movies`,
                name: `Popular ${name} Movies`,
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_original_language=${code}&sort_by=popularity.desc`,
                pages: 1,
            },
            {
                id: `${code}-series`,
                name: `Popular ${name} Series`,
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_original_language=${code}&sort_by=popularity.desc`,
                pages: 1,
            },
        ]);
        // Seeded pseudo-random for deterministic shuffling across instances
        const seededRandom = (seed) => {
            let x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };
        let railSeed = Date.now();
        const getRandomName = (names) => names[Math.floor(seededRandom(railSeed++) * names.length)];
        const curatedRails = [
            {
                id: "scifi-hits",
                name: getRandomName([
                    "Sci-Fi Mindbenders",
                    "Imaginative Sci-Fi",
                    "Out of This World",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=878&sort_by=vote_average.desc&vote_count.gte=500`,
            },
            {
                id: "horror-nights",
                name: getRandomName([
                    "Horror & Thrills",
                    "Chilling Horror Movies",
                    "Ominous Thrillers",
                    "Scary Movies",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=27,53&sort_by=popularity.desc`,
            },
            {
                id: "family-time",
                name: getRandomName([
                    "Family Favorites",
                    "Movies for the Whole Family",
                    "Kids & Family",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=10751&sort_by=popularity.desc`,
            },
            {
                id: "documentary",
                name: getRandomName([
                    "Documentary Features",
                    "Critically Acclaimed Documentaries",
                    "Real Life Stories",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=99&sort_by=popularity.desc`,
            },
            {
                id: "comedy-gold",
                name: getRandomName([
                    "Comedy Gold",
                    "Feel-Good Comedies",
                    "Laugh-Out-Loud Movies",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=35&sort_by=popularity.desc`,
            },
            {
                id: "action-packed",
                name: getRandomName([
                    "High Octane Action",
                    "Action & Adventure",
                    "Explosive Action Movies",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=28&sort_by=popularity.desc`,
            },
            {
                id: "romance-picks",
                name: getRandomName(["Romantic Dramas", "Heartfelt Movies", "Romance"]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=10749&sort_by=popularity.desc`,
            },
            {
                id: "thriller-tv",
                name: getRandomName([
                    "Gripping TV Thrillers",
                    "Suspenseful TV Shows",
                    "Crime Thrillers",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=80,53&sort_by=popularity.desc`,
            },
            {
                id: "crime-series",
                name: getRandomName([
                    "Crime & Investigation",
                    "True Crime Inspired",
                    "Gritty Crime TV Shows",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=80&sort_by=popularity.desc`,
            },
            {
                id: "mystery-box",
                name: getRandomName([
                    "Mystery & Suspense",
                    "Whodunit TV Shows",
                    "Mind-Bending Mysteries",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=9648&sort_by=popularity.desc`,
            },
            {
                id: "award-winners",
                name: getRandomName([
                    "Award-Winning Cinema",
                    "Critically Acclaimed Movies",
                    "Oscar Winners",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&vote_average.gte=8&vote_count.gte=1000`,
            },
            {
                id: "classic-rewind",
                name: getRandomName([
                    "Classic Rewind",
                    "Nostalgic Movies",
                    "Throwback Movies",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&release_date.lte=1990-12-31&sort_by=popularity.desc`,
            },
            {
                id: "indie-gems",
                name: getRandomName([
                    "Indie & Art House",
                    "Independent Movies",
                    "Critically Acclaimed Indie",
                ]),
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=18&vote_average.gte=7&vote_count.gte=200`,
            },
            {
                id: "k-drama",
                name: getRandomName([
                    "K-Drama Hits",
                    "Korean TV Shows",
                    "Binge-Worthy K-Dramas",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_original_language=ko&sort_by=popularity.desc`,
            },
            {
                id: "british-tv",
                name: getRandomName([
                    "British TV Dramas",
                    "Acclaimed British Shows",
                    "Made in the UK",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_original_language=en&origin_country=GB&sort_by=popularity.desc`,
            },
            {
                id: "fantasy-realms",
                name: getRandomName([
                    "Fantasy Worlds",
                    "Epic Fantasy Series",
                    "Magical TV",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=10765&sort_by=popularity.desc`,
            },
            {
                id: "animation-tv",
                name: getRandomName([
                    "Animated Series",
                    "Adult Animation",
                    "Toons for Everyone",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=16&sort_by=popularity.desc`,
            },
            {
                id: "reality-tv",
                name: getRandomName([
                    "Reality TV",
                    "Unscripted TV",
                    "Binge-Worthy Reality",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=10764&sort_by=popularity.desc`,
            },
        ];
        const shuffledCurated = curatedRails
            .sort((a, b) => seededRandom(railSeed++) - 0.5)
            .slice(0, 10);
        const shuffledRegional = regionalRails
            .sort((a, b) => seededRandom(railSeed++) - 0.5)
            .slice(0, 8);
        const indianCinemaRail = {
            id: "indian-cinema-hits",
            name: "South Indian & Bollywood Hits",
            mediaType: "movie",
            path: `discover/movie?${baseDiscoverMovie}&with_original_language=hi|ta|te|ml|kn&sort_by=popularity.desc&vote_count.gte=100`,
        };
        return [
            {
                id: "trending-movies",
                name: "Trending Movies",
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&sort_by=popularity.desc`,
            },
            {
                id: "recently-added-movies",
                name: "Recently Added Movies",
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&sort_by=primary_release_date.desc&primary_release_date.lte=${today}`,
            },
            {
                id: "leaving-soon-movies",
                name: "Leaving Soon",
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&sort_by=popularity.asc`,
            },
            {
                id: "upcoming-movies",
                name: "Upcoming Movies",
                mediaType: "movie",
                path: `discover/movie?${baseUpcomingMovie}&primary_release_date.gte=${today}`,
            },
            {
                id: "popular-movies",
                name: "Popular Movies",
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&sort_by=popularity.desc`,
            },
            {
                id: "top-rated-movies",
                name: "Top Rated Movies",
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&sort_by=vote_average.desc&vote_count.gte=1000`,
            },
            {
                id: "trending-series",
                name: "Trending TV Shows",
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&sort_by=popularity.desc`,
            },
            {
                id: "recently-added-series",
                name: "Recently Added TV Shows",
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&sort_by=first_air_date.desc&first_air_date.lte=${today}`,
            },
            {
                id: "upcoming-series",
                name: "Upcoming TV Shows",
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&first_air_date.gte=${today}`,
            },
            {
                id: "popular-series",
                name: "Popular TV Shows",
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&sort_by=popularity.desc`,
            },
            {
                id: "action-adventure-tv",
                name: getRandomName([
                    "Action & Adventure",
                    "Epic TV Action",
                    "Adrenaline Rush",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=10759&sort_by=popularity.desc`,
            },
            {
                id: "comedy-tv",
                name: getRandomName(["TV Comedies", "Sitcoms", "Laugh-Out-Loud TV"]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=35&sort_by=popularity.desc`,
            },
            {
                id: "drama-tv",
                name: getRandomName([
                    "TV Dramas",
                    "Critically Acclaimed TV",
                    "Binge-Worthy Dramas",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=18&sort_by=popularity.desc`,
            },
            {
                id: "family-tv",
                name: getRandomName([
                    "Family TV Shows",
                    "Kids & Family",
                    "Watch Together",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=10751,10762&sort_by=popularity.desc`,
            },
            {
                id: "documentary-tv",
                name: getRandomName([
                    "Docuseries",
                    "Real Life Stories",
                    "Critically Acclaimed Documentaries",
                ]),
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=99&sort_by=popularity.desc`,
            },
            {
                id: "trending-anime",
                name: "Trending Anime",
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&first_air_date.gte=${recentDateIso}&first_air_date.lte=${today}`,
            },
            {
                id: "popular-anime",
                name: "Popular Anime Series",
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
            },
            {
                id: "top-rated-anime",
                name: "Top Rated Anime",
                mediaType: "tv",
                path: `discover/tv?${baseDiscoverTv}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=500`,
            },
            {
                id: "anime-movies",
                name: "Anime Movies",
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
            },
            ...shuffledCurated,
            indianCinemaRail,
            {
                id: "multi-language-dubs",
                name: "Available in Multiple Languages",
                mediaType: "movie",
                path: `discover/movie?${baseDiscoverMovie}&with_original_language=en|te|ta|ml&with_spoken_languages=hi|ta|te&sort_by=popularity.desc&vote_count.gte=500`,
            },
            ...shuffledRegional,
        ];
    }
    async verifyOttRelease(tmdbId) {
        try {
            const data = await this.tmdb(`movie/${tmdbId}/release_dates`);
            if (!data || !data.results)
                return true;
            const now = new Date();
            for (const country of data.results) {
                for (const rd of country.release_dates) {
                    if (rd.type === 4 || rd.type === 5) {
                        const rDate = new Date(rd.release_date);
                        if (rDate <= now) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        catch (e) {
            this.logger.warn(`Failed to verify OTT release for ${tmdbId}: ${e.message}`);
            return false; // Don't assume released on error
        }
    }
    async loadCatalog(platform) {
        const state = this.state[platform];
        state.lastRefreshAttemptAt = Date.now();
        try {
            await this.loadGenres();
            await this.loadRealNetflixStatus(platform);
            const dynamicRails = this.buildDynamicRails(platform);
            const loadedMovies = new Map();
            const categories = [];
            for (let rIdx = 0; rIdx < dynamicRails.length; rIdx += 3) {
                const railChunk = dynamicRails.slice(rIdx, rIdx + 3);
                const chunkCategories = await Promise.all(railChunk.map(async (rail) => {
                    const isUpcomingRail = rail.id.includes("upcoming");
                    const pageCount = isUpcomingRail
                        ? 8
                        : (rail.pages ?? this.pagesPerRail);
                    const pageIndexes = Array.from({ length: pageCount }, (_, i) => i + 1);
                    const pages = [];
                    for (let i = 0; i < pageIndexes.length; i += 3) {
                        const chunk = pageIndexes.slice(i, i + 3);
                        const chunkResults = await Promise.all(chunk.map((idx) => this.tmdb(rail.path, { page: String(idx) }).catch((err) => {
                            this.logger.warn(`Failed page ${idx} for ${rail.id}: ${err.message}`);
                            return { results: [] };
                        })));
                        pages.push(...chunkResults);
                        if (i + 3 < pageIndexes.length)
                            await new Promise((r) => setTimeout(r, 250));
                    }
                    const allItems = pages.flatMap((page) => page.results || []);
                    const uniqueTitles = new Map();
                    allItems.forEach((item) => {
                        const movie = this.toMovie(item, rail.mediaType);
                        if ((movie.posterUrl || movie.backdropUrl) &&
                            !uniqueTitles.has(movie.id)) {
                            if (state.realRecentlyAddedTmdbIds.size > 0 ||
                                state.realLeavingSoonTmdbIds.size > 0) {
                                movie.isRecentlyAdded = state.realRecentlyAddedTmdbIds.has(String(movie.tmdbId));
                                movie.isLeavingSoon = state.realLeavingSoonTmdbIds.has(String(movie.tmdbId));
                            }
                            else {
                                if (rail.id.includes("recently-added"))
                                    movie.isRecentlyAdded = true;
                                if (rail.id.includes("leaving-soon"))
                                    movie.isLeavingSoon = true;
                            }
                            uniqueTitles.set(movie.id, movie);
                            loadedMovies.set(movie.id, movie);
                        }
                    });
                    let titlesArr = Array.from(uniqueTitles.values());
                    let titles;
                    if (isUpcomingRail) {
                        let upcomingTitles = titlesArr.filter((movie) => movie.isUpcoming);
                        if (upcomingTitles.length < 12) {
                            const fallback = titlesArr;
                            const existingIds = new Set(upcomingTitles.map((t) => t.id));
                            for (const f of fallback) {
                                if (!existingIds.has(f.id)) {
                                    upcomingTitles.push(f);
                                    existingIds.add(f.id);
                                }
                                if (upcomingTitles.length >= this.itemsPerRail)
                                    break;
                            }
                        }
                        titles = upcomingTitles.slice(0, this.itemsPerRail);
                    }
                    else {
                        titles = titlesArr
                            .filter((movie) => !movie.isUpcoming)
                            .slice(0, this.itemsPerRail);
                    }
                    return {
                        id: rail.id,
                        name: rail.name,
                        slug: rail.id,
                        movies: titles,
                    };
                }));
                categories.push(...chunkCategories);
                if (rIdx + 3 < dynamicRails.length)
                    await new Promise((r) => setTimeout(r, 500));
            }
            if (loadedMovies.size > 0) {
                this.state[platform].movies.clear();
                state.tmdbIdIndex.clear();
                for (const [id, movie] of loadedMovies) {
                    state.movies.set(id, movie);
                    if (movie.tmdbId)
                        state.tmdbIdIndex.set(movie.tmdbId.toString(), id);
                }
                this.state[platform].categories = categories.filter((c) => c.movies.length >= 1);
                this.lastCatalogError = undefined;
                this.logger.log(`Loaded ${this.state[platform].movies.size} unique titles across ${this.state[platform].categories.length} TMDB dynamic rails.`);
            }
            else {
                throw new Error("No titles could be fetched from TMDB.");
            }
        }
        catch (error) {
            this.lastCatalogError =
                error instanceof Error ? error.message : String(error);
            this.logger.error("Unable to load the TMDB catalog. Generating fallback catalog.", this.lastCatalogError);
            this.populateFallbackCatalog(platform);
        }
        // B5 fix: Don't set refreshInFlight here — the .finally() in refreshCatalog handles it
        // finally {
        //     state.refreshInFlight = null;
        // }
    }
    populateFallbackCatalog(platform) {
        const mockMovies = [
            {
                id: "m-157336",
                tmdbId: "157336",
                title: "Interstellar",
                description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.",
                posterUrl: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                backdropUrl: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsY2v.jpg",
                releaseYear: 2014,
                matchScore: 98,
                maturityRating: "PG-13",
                duration: "2h 49m",
                genres: ["Sci-Fi", "Adventure", "Drama"],
                videoUrl: this.encodeUrl("https://www.2embed.cc/embed/157336"),
                trailerUrl: "",
                cast: ["Matthew McConaughey", "Anne Hathaway"],
                director: "Christopher Nolan",
                tags: ["Sci-Fi", "Space"],
                audioLanguages: ["English"],
                subtitleLanguages: ["English"],
                isSeries: false,
            },
            {
                id: "m-27205",
                tmdbId: "27205",
                title: "Inception",
                description: "A thief who steals corporate secrets through the use of dream-sharing technology.",
                posterUrl: "https://image.tmdb.org/t/p/w780/oYuLE1h2CVCdIF9i2V47h7918x8.jpg",
                backdropUrl: "https://image.tmdb.org/t/p/w1280/8ZTVqvTZ25nDzzvFiJ19bWb2vT5.jpg",
                releaseYear: 2010,
                matchScore: 97,
                maturityRating: "PG-13",
                duration: "2h 28m",
                genres: ["Action", "Sci-Fi", "Thriller"],
                videoUrl: this.encodeUrl("https://www.2embed.cc/embed/27205"),
                trailerUrl: "",
                cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
                director: "Christopher Nolan",
                tags: ["Sci-Fi", "Dreams"],
                audioLanguages: ["English"],
                subtitleLanguages: ["English"],
                isSeries: false,
            },
            {
                id: "m-1399",
                tmdbId: "1399",
                title: "Game of Thrones",
                description: "Nine noble families fight for control over the lands of Westeros.",
                posterUrl: "https://image.tmdb.org/t/p/w780/1XS1oqL89vEDVXtMK9Z08as1Coc.jpg",
                backdropUrl: "https://image.tmdb.org/t/p/w1280/2OMG0YKMh28TIG92Lh2168926.jpg",
                releaseYear: 2011,
                matchScore: 99,
                maturityRating: "TV-MA",
                duration: "8 Seasons",
                genres: ["Drama", "Action", "Sci-Fi"],
                videoUrl: this.encodeUrl("https://www.2embed.cc/embed/1399/1/1"),
                trailerUrl: "",
                cast: ["Emilia Clarke", "Kit Harington"],
                director: "David Benioff",
                tags: ["Fantasy", "Dragons"],
                audioLanguages: ["English"],
                subtitleLanguages: ["English"],
                isSeries: true,
            },
            {
                id: "m-66732",
                tmdbId: "66732",
                title: "Stranger Things",
                description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments.",
                posterUrl: "https://image.tmdb.org/t/p/w780/49WJfeN0moxb9IPfGn88qMG4d2.jpg",
                backdropUrl: "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rvyEQypROD7P.jpg",
                releaseYear: 2016,
                matchScore: 96,
                maturityRating: "TV-14",
                duration: "4 Seasons",
                genres: ["Sci-Fi", "Horror", "Drama"],
                videoUrl: this.encodeUrl("https://www.2embed.cc/embed/66732/1/1"),
                trailerUrl: "",
                cast: ["Millie Bobby Brown", "Finn Wolfhard"],
                director: "The Duffer Brothers",
                tags: ["Sci-Fi", "80s"],
                audioLanguages: ["English"],
                subtitleLanguages: ["English"],
                isSeries: true,
            },
        ];
        mockMovies.forEach((m) => {
            this.state[platform].movies.set(m.id, m);
            this.state[platform].tmdbIdIndex.set(m.tmdbId, m.id);
        });
        this.state[platform].categories = [
            {
                id: "trending",
                name: "Trending Now",
                slug: "trending",
                movies: mockMovies,
            },
            {
                id: "popular",
                name: "Popular on Streamly",
                slug: "popular",
                movies: [...mockMovies].reverse(),
            },
        ];
    }
    async ensureCatalog(platform = "netflix") {
        this.ensureConfigured();
        if (!platform_state_1.ALL_PLATFORMS.includes(platform))
            platform = "netflix";
        const state = this.state[platform];
        if (state.movies.size === 0 && !state.refreshInFlight) {
            state.refreshInFlight = this.refreshCatalog(platform);
        }
        if (state.refreshInFlight) {
            await state.refreshInFlight;
        }
        if (state.categories.length)
            return;
        if (Date.now() - state.lastRefreshAttemptAt >= this.refreshRetryMs) {
            await this.refreshCatalog(platform);
        }
        if (!state.categories.length) {
            this.logger.warn(`TMDB catalog empty for ${platform}, generating emergency fallback rails.`);
            this.populateFallbackCatalog(platform);
        }
    }
    toLightweightMovie(m) {
        return {
            id: m.id,
            tmdbId: m.tmdbId,
            imdbId: m.imdbId,
            title: m.title,
            originalTitle: m.originalTitle,
            description: m.description,
            posterUrl: m.posterUrl,
            backdropUrl: m.backdropUrl,
            matchScore: m.matchScore,
            isRecentlyAdded: m.isRecentlyAdded,
            isLeavingSoon: m.isLeavingSoon,
            isUpcoming: m.isUpcoming,
            trailerUrl: m.trailerUrl,
            maturityRating: m.maturityRating,
            duration: m.duration,
            isSeries: m.isSeries,
            seasonsCount: m.seasonsCount,
            logoUrl: m.logoUrl,
            releaseYear: m.releaseYear,
            top10Rank: m.top10Rank,
            genres: m.genres || [],
            tags: m.tags || [],
            audioLanguages: m.audioLanguages || [],
            sources: m.sources || [],
            videoUrl: m.videoUrl,
            embedUrl: m.embedUrl,
            cast: m.cast || [],
            director: m.director,
            availablePlatforms: m.availablePlatforms || [],
        };
    }
    async getAllMovies(platform = "netflix") {
        await this.ensureCatalog(platform);
        const allMovies = this.state[platform].categories.flatMap((c) => c.movies);
        const uniqueMap = new Map();
        for (const m of allMovies) {
            if (!uniqueMap.has(m.id))
                uniqueMap.set(m.id, m);
        }
        const uniqueMovies = Array.from(uniqueMap.values());
        return uniqueMovies.map((m) => this.toLightweightMovie(m));
    }
    async getTop10Movies(platform = "netflix") {
        await this.ensureCatalog(platform);
        const allMovies = this.state[platform].categories.flatMap((c) => c.movies);
        const uniqueMap = new Map();
        for (const m of allMovies) {
            if (!uniqueMap.has(m.id))
                uniqueMap.set(m.id, m);
        }
        const uniqueMovies = Array.from(uniqueMap.values());
        return uniqueMovies
            .sort((a, b) => b.matchScore - a.matchScore || b.releaseYear - a.releaseYear)
            .slice(0, 10)
            .map((m) => this.toLightweightMovie(m));
    }
    async getFeaturedMovie(platform = "netflix") {
        await this.ensureCatalog(platform);
        const trendingMovies = this.state[platform].categories
            .find((c) => c.id === "trending-movies")
            ?.movies.slice(0, 10) || [];
        const trendingSeries = this.state[platform].categories
            .find((c) => c.id === "trending-series")
            ?.movies.slice(0, 10) || [];
        const trendingAnime = this.state[platform].categories
            .find((c) => c.id === "trending-anime")
            ?.movies.slice(0, 5) || [];
        const topMovies = [...trendingMovies, ...trendingSeries, ...trendingAnime];
        await Promise.all(topMovies.map(async (feat) => {
            if (feat && !feat.logoUrl) {
                try {
                    const mediaType = feat.isSeries ? "tv" : "movie";
                    const details = await this.tmdb(`${mediaType}/${feat.tmdbId}`, {
                        append_to_response: "images",
                        include_image_language: "en,null,ja,ko,zh,hi,ta,te,ml,kn,fr,es,de,it,pt,ru,ar,tr,th",
                    });
                    const logoObj = details.images?.logos?.find((l) => l.iso_639_1 === "en") ||
                        details.images?.logos?.[0];
                    if (logoObj?.file_path) {
                        feat.logoUrl = this.image(logoObj.file_path, "w500");
                    }
                }
                catch (e) {
                    this.logger.error("Failed to fetch featured movie logo", e);
                }
            }
        }));
        return topMovies;
    }
    async getCategories(platform = "netflix") {
        if (platform === "all")
            return this.getAllAggregatedCategories();
        await this.ensureCatalog(platform);
        return this.state[platform].categories.map((cat) => ({
            ...cat,
            movies: cat.movies.map((m) => this.toLightweightMovie(m)),
        }));
    }
    async getAllAggregatedCategories() {
        const platforms = ["netflix", "prime", "hotstar", "appletv", "zee5", "sonyliv", "jio"];
        await Promise.all(platforms.map((p) => this.ensureCatalog(p)));
        const catMap = new Map();
        const processData = (data, source, sourceName) => {
            data.forEach((cat) => {
                if (!catMap.has(cat.name))
                    catMap.set(cat.name, []);
                catMap
                    .get(cat.name)
                    .push(...cat.movies.map((m) => ({
                    ...this.toLightweightMovie(m),
                    source,
                    sourceName,
                })));
            });
        };
        processData(this.state.netflix.categories, "netflix", "Netflix");
        processData(this.state.prime.categories, "prime", "Prime Video");
        processData(this.state.hotstar.categories, "hotstar", "Hotstar");
        processData(this.state.appletv.categories, "appletv", "Apple TV+");
        processData(this.state.zee5.categories, "zee5", "Zee5");
        processData(this.state.sonyliv.categories, "sonyliv", "Sony LIV");
        processData(this.state.jio.categories, "jio", "JioCinema");
        const aggregated = [];
        const allUniqueMovies = new Map();
        for (const [name, allMovies] of catMap.entries()) {
            const uniqueMoviesMap = new Map();
            for (const m of allMovies) {
                const key = m.tmdbId || m.id;
                if (!uniqueMoviesMap.has(key)) {
                    uniqueMoviesMap.set(key, m);
                    allUniqueMovies.set(key, m);
                }
            }
            aggregated.push({
                id: name,
                name,
                slug: name,
                movies: Array.from(uniqueMoviesMap.values()).slice(0, 30),
            });
        }
        const allMoviesList = Array.from(allUniqueMovies.values());
        const allGenres = new Set();
        allMoviesList.forEach((m) => {
            if (m.genres && Array.isArray(m.genres)) {
                m.genres.forEach((g) => allGenres.add(g));
            }
        });
        for (const genre of Array.from(allGenres)) {
            if (aggregated.find((c) => c.name.toLowerCase() === genre.toLowerCase()))
                continue;
            const genreMovies = allMoviesList.filter((m) => m.genres?.includes(genre));
            if (genreMovies.length > 5) {
                aggregated.push({
                    id: `genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    name: genre,
                    slug: `genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    movies: genreMovies.sort((a, b) => seededRandom(railSeed++) - 0.5),
                });
            }
        }
        return aggregated
            .sort((a, b) => b.movies.length - a.movies.length)
            .map((c) => ({ ...c, movies: c.movies.slice(0, 30) }));
    }
    async getAllFeaturedMovies() {
        const platforms = ["netflix", "prime", "hotstar", "appletv", "zee5", "sonyliv", "jio"];
        const results = await Promise.all(platforms.map(async (p) => {
            try {
                const data = await this.getFeaturedMovie(p);
                const nameMap = {
                    netflix: "Netflix",
                    prime: "Prime Video",
                    hotstar: "Hotstar",
                    appletv: "Apple TV+",
                    zee5: "Zee5",
                    sonyliv: "Sony LIV",
                    jio: "JioCinema",
                };
                return data.map((m) => ({ ...m, source: p, sourceName: nameMap[p] }));
            }
            catch (e) {
                return [];
            }
        }));
        let featSeed = Date.now();
        return results.flat().sort((a, b) => seededRandom(featSeed++) - 0.5);
    }
    selectTrailerVideo(videos, originalLanguage, platform) {
        const preferredLanguages = [
            originalLanguage,
            this.language.split("-")[0],
            "en",
        ].filter(Boolean);
        const score = (video) => {
            const typeScore = video.type === "Trailer"
                ? 300
                : video.type === "Teaser"
                    ? 100
                    : video.type === "Clip"
                        ? 50
                        : 10;
            const officialScore = video.official === true ? 1_000 : 0;
            const languageScore = preferredLanguages.indexOf(video.iso_639_1) >= 0
                ? (preferredLanguages.length -
                    preferredLanguages.indexOf(video.iso_639_1)) *
                    10
                : 0;
            const isOriginalLang = video.iso_639_1 === originalLanguage ? 5000 : 0;
            let platformBonus = 0;
            const vName = (video.name || "").toLowerCase();
            if (platform === "prime" &&
                (vName.includes("amazon") || vName.includes("prime"))) {
                platformBonus = 10000;
            }
            else if (platform === "netflix" && vName.includes("netflix")) {
                platformBonus = 10000;
            }
            else if (platform === "hotstar" &&
                (vName.includes("hotstar") || vName.includes("disney"))) {
                platformBonus = 10000;
            }
            else if (platform === "appletv" && vName.includes("apple")) {
                platformBonus = 10000;
            }
            else if (platform === "zee5" && vName.includes("zee5")) {
                platform;
            }
            const publishedAt = Date.parse(video.published_at || "");
            return (officialScore +
                typeScore +
                languageScore +
                isOriginalLang +
                platformBonus +
                (Number.isFinite(publishedAt) ? publishedAt / 1e13 : 0));
        };
        return videos
            .filter((video) => video?.site === "YouTube" &&
            typeof video.key === "string" &&
            video.key.length > 0 &&
            (video.type === "Trailer" ||
                video.type === "Teaser" ||
                video.type === "Clip" ||
                video.type === "Featurette"))
            .sort((left, right) => score(right) - score(left) ||
            String(left.id || "").localeCompare(String(right.id || "")))[0];
    }
    async getMovieById(id, platform = "netflix") {
        await this.ensureCatalog(platform);
        let movie = this.state[platform].movies.get(id);
        if (movie) movie = { ...movie }; // B8 fix: clone to avoid mutating cache
        if (!movie) {
            const internalId = this.state[platform].tmdbIdIndex.get(id);
            if (internalId)
                movie = this.state[platform].movies.get(internalId);
        }
        if (!movie) {
            for (const p of platform_state_1.ALL_PLATFORMS) {
                if (p === platform)
                    continue;
                movie = this.state[p].movies.get(id);
                if (!movie) {
                    const internalId = this.state[p].tmdbIdIndex.get(id);
                    if (internalId)
                        movie = this.state[p].movies.get(internalId);
                }
                if (movie)
                    break;
            }
        }
        if (!movie && id.startsWith("tmdb-")) {
            this.logger.log(`Movie ${id} not in cache, fetching live from TMDB...`);
            const isTv = id.includes("-tv-");
            const tmdbIdStr = id.split("-").pop();
            if (tmdbIdStr) {
                try {
                    const details = await this.tmdb(`${isTv ? "tv" : "movie"}/${tmdbIdStr}`);
                    movie = this.toMovie(details, isTv ? "tv" : "movie");
                    this.state[platform].movies.set(movie.id, movie);
                    if (movie.tmdbId)
                        this.state[platform].tmdbIdIndex.set(movie.tmdbId, movie.id);
                }
                catch (e) {
                    this.logger.warn(`Live fetch failed for ${id}: ${e}`);
                }
            }
        }
        if (!movie)
            throw new common_1.NotFoundException(`Title "${id}" was not found.`);
        if (!movie.cast?.length ||
            !movie.videoUrl ||
            !movie.logoUrl ||
            !movie.trailerUrl ||
            movie.seasonsCount === undefined) {
            try {
                const isTvType = movie.isSeries ||
                    movie.id.startsWith("tmdb-tv-") ||
                    movie.seasonsCount !== undefined;
                const mediaType = isTvType ? "tv" : "movie";
                const details = await this.tmdb(`${mediaType}/${movie.tmdbId}`, {
                    append_to_response: "credits,videos,images,translations,keywords,external_ids",
                    include_image_language: "en,null,ja,ko,zh,hi,ta,te,ml,kn,fr,es,de,it,pt,ru,ar,tr,th",
                    include_video_language: "en,null,ja,ko,zh,hi,ta,te,ml,kn,fr,es,de,it,pt,ru,ar,tr,th",
                });
                if (details.number_of_seasons !== undefined || details.first_air_date) {
                    movie.isSeries = true;
                    movie.seasonsCount = details.number_of_seasons || 1;
                }
                if (details.external_ids?.imdb_id) {
                    movie.imdbId = details.external_ids.imdb_id;
                }
                const logoObj = details.images?.logos?.find((l) => l.iso_639_1 === "en") ||
                    details.images?.logos?.[0];
                if (logoObj?.file_path) {
                    movie.logoUrl = this.image(logoObj.file_path, "w500");
                }
                const bestVideo = this.selectTrailerVideo(details.videos?.results || [], details.original_language, platform);
                if (bestVideo) {
                    movie.trailerUrl = this.encodeUrl(`https://www.youtube.com/embed/${bestVideo.key}?autoplay=1`);
                }
                const origLang = LANGUAGE_NAMES[details.original_language] || "";
                const spoken = (details.spoken_languages || [])
                    .map((lang) => lang.english_name || lang.name || LANGUAGE_NAMES[lang.iso_639_1])
                    .filter(Boolean);
                if (origLang)
                    spoken.unshift(origLang);
                if (spoken.length) {
                    movie.audioLanguages = Array.from(new Set(spoken));
                }
                else if (!movie.audioLanguages?.length) {
                    movie.audioLanguages = [];
                }
                const rawKeywords = details.keywords?.keywords || details.keywords?.results || [];
                const tagsList = rawKeywords.slice(0, 5).map((k) => {
                    return k.name
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ");
                });
                if (tagsList.length)
                    movie.tags = tagsList;
                const fullCast = (details.credits?.cast || [])
                    .slice(0, 10)
                    .map((c) => ({
                    id: c.id,
                    name: c.name,
                    character: c.character || "Cast",
                    profileUrl: c.profile_path
                        ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                        : null,
                }));
                if (fullCast.length) {
                    movie.cast = fullCast;
                }
                const director = details.credits?.crew?.find((c) => c.job === "Director")?.name ||
                    details.credits?.crew?.find((c) => c.job === "Executive Producer")?.name;
                if (director)
                    movie.director = director;
                if (details.runtime) {
                    const hours = Math.floor(details.runtime / 60);
                    const mins = details.runtime % 60;
                    movie.duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                }
                else if (details.episode_run_time?.[0]) {
                    movie.duration = `${details.episode_run_time[0]}m`;
                }
                if (details.overview) {
                    movie.longDescription = details.overview;
                }
                if (details.imdb_id || details.external_ids?.imdb_id) {
                    movie.imdbId = details.imdb_id || details.external_ids?.imdb_id;
                }
                const rawDate = details.release_date || details.first_air_date;
                if (rawDate) {
                    movie.releaseDate = rawDate;
                    const relTime = new Date(rawDate).getTime();
                    if (!isNaN(relTime) && relTime > Date.now()) {
                        movie.isUpcoming = true;
                    }
                }
                if (movie.isSeries) {
                    movie.seasonsCount = details.number_of_seasons || 1;
                }
            }
            catch (err) {
                this.logger.warn(`Could not enrich metadata for ${id}: ${err}`);
            }
        }
        const availablePlatforms = [];
        const tmdbId = movie.tmdbId;
        if (tmdbId) {
            for (const p of platform_state_1.ALL_PLATFORMS) {
                const catalogId = this.state[p].tmdbIdIndex.get(tmdbId);
                if (catalogId && this.state[p].movies.has(catalogId)) {
                    availablePlatforms.push(platform_state_1.PLATFORM_LABELS[p]);
                }
            }
        }
        return { ...movie, availablePlatforms };
    }
    async getSeasonEpisodes(id, seasonNumber, platform = "netflix") {
        await this.ensureCatalog(platform);
        let movie = this.state[platform].movies.get(id);
        if (movie) movie = { ...movie }; // B8 fix: clone to avoid mutating cache
        if (!movie) {
            const internalId = this.state[platform].tmdbIdIndex.get(id);
            if (internalId)
                movie = this.state[platform].movies.get(internalId);
        }
        if (!movie)
            return [];
        if (movie.isSeries === undefined || movie.seasonsCount === undefined) {
            try {
                await this.getMovieById(id, platform);
                movie = this.state[platform].movies.get(id) || movie;
            }
            catch (e) {
                this.logger.error("Failed to fetch featured movie logo", e);
            }
        }
        try {
            const cacheKey = `${id}_${seasonNumber}_${platform}`;
            if (this.seasonEpisodesCache.has(cacheKey)) {
                return this.seasonEpisodesCache.get(cacheKey);
            }
            const tmdbId = movie.tmdbId ??
                (typeof movie.id === "string" && movie.id.startsWith("tmdb-tv-")
                    ? movie.id.replace(/^tmdb-tv-/, "")
                    : undefined);
            if (!tmdbId) {
                this.logger.warn(`Cannot load episodes for ${id} in ${platform}: missing TMDB id`);
                return [];
            }
            const seasonData = await this.tmdb(`tv/${String(tmdbId)}/season/${seasonNumber}`);
            const rawEpisodes = seasonData.episodes || [];
            const episodes = rawEpisodes.map((ep) => {
                const s = seasonNumber;
                const e = ep.episode_number;
                return {
                    id: `ep-${movie.tmdbId}-${s}-${e}`,
                    title: ep.name || `Episode ${e}`,
                    description: ep.overview || "",
                    duration: ep.runtime ? `${ep.runtime}m` : "",
                    episodeNumber: e,
                    seasonNumber: s,
                    thumbnailUrl: this.image(ep.still_path) || movie.backdropUrl,
                    airDate: ep.air_date || "",
                };
            });
            // B12 fix: Limit cache size to prevent memory leak
            if (this.seasonEpisodesCache.size > 500) {
                const firstKey = this.seasonEpisodesCache.keys().next().value;
                if (firstKey) this.seasonEpisodesCache.delete(firstKey);
            }
            this.seasonEpisodesCache.set(cacheKey, episodes);
            return episodes;
        }
        catch (err) {
            this.logger.warn(`Failed to load season ${seasonNumber} for ${id}: ${err}`);
            return [];
        }
    }
    async searchMovies(query, genre, platform = "netflix") {
        this.ensureConfigured();
        const normalized = query.trim().toLowerCase();
        const cacheKey = `${normalized}_${genre || "all"}`;
        if (this.state[platform].searchCache.has(cacheKey)) {
            return this.state[platform].searchCache.get(cacheKey);
        }
        if (!normalized) {
            const allMovies = await this.getAllMovies(platform);
            const res = { movies: this.filterGenre(allMovies, genre) };
            if (this.state[platform].searchCache.size > 100) {
                const firstKey = this.state[platform].searchCache.keys().next().value;
                if (firstKey)
                    this.state[platform].searchCache.delete(firstKey);
            }
            this.state[platform].searchCache.set(cacheKey, res);
            return res;
        }
        try {
            // B6 fix: Cache combined movies to avoid re-fetching all 7 platforms on every search
            if (!this._combinedMoviesCache || !this._combinedMoviesCacheTime || (Date.now() - this._combinedMoviesCacheTime > 5 * 60 * 1000)) {
                this._combinedMoviesCache = new Map();
                await Promise.all(platform_state_1.ALL_PLATFORMS.map(async (p) => {
                    const pMovies = await this.getAllMovies(p);
                    for (const movie of pMovies) {
                        const key = movie.tmdbId || movie.title;
                        if (!this._combinedMoviesCache.has(key)) {
                            this._combinedMoviesCache.set(key, {
                                ...movie,
                                platform: p,
                                availablePlatforms: [platform_state_1.PLATFORM_LABELS[p]],
                            });
                        }
                        else {
                            const existing = this._combinedMoviesCache.get(key);
                            if (!existing.availablePlatforms.includes(platform_state_1.PLATFORM_LABELS[p])) {
                                existing.availablePlatforms.push(platform_state_1.PLATFORM_LABELS[p]);
                            }
                        }
                    }
                }));
                this._combinedMoviesCacheTime = Date.now();
            }
            const combinedMoviesMap = this._combinedMoviesCache;
            let resultsWithScores = Array.from(combinedMoviesMap.values()).map((m) => {
                let score = 0;
                const t = m.title.toLowerCase();
                if (t === normalized)
                    score += 100;
                else if (t.startsWith(normalized))
                    score += 50;
                else if (t.includes(normalized))
                    score += 10;
                if (m.originalTitle &&
                    m.originalTitle.toLowerCase().includes(normalized))
                    score += 5;
                if (m.genres &&
                    m.genres.some((g) => g.toLowerCase().includes(normalized)))
                    score += 5;
                if (m.tags &&
                    m.tags.some((g) => g.toLowerCase().includes(normalized)))
                    score += 3;
                const castStr = m.cast
                    ? m.cast
                        .map((c) => (typeof c === "string" ? c : c.name))
                        .join(" ")
                        .toLowerCase()
                    : "";
                const dirStr = m.director ? m.director.toLowerCase() : "";
                const descStr = m.description ? m.description.toLowerCase() : "";
                if (castStr.includes(normalized))
                    score += 8;
                if (dirStr.includes(normalized))
                    score += 8;
                if (descStr.includes(normalized))
                    score += 1;
                const tokens = normalized.split(/[\s'’:\-]+/).filter(Boolean);
                if (tokens.length > 0) {
                    const searchCorpus = `${t} ${m.originalTitle || ""} ${dirStr} ${castStr} ${m.releaseYear || ""} ${descStr}`;
                    let matchedTokensCount = 0;
                    for (const token of tokens) {
                        if (searchCorpus.includes(token)) {
                            matchedTokensCount++;
                            if (t.includes(token) || dirStr.includes(token)) {
                                score += 3;
                            }
                            else {
                                score += 1;
                            }
                        }
                    }
                    if (matchedTokensCount === tokens.length)
                        score += 25;
                    else if (matchedTokensCount > 0)
                        score += matchedTokensCount * 2;
                }
                return { movie: m, score };
            });
            let results = resultsWithScores
                .filter((item) => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map((item) => item.movie);
            results = this.filterGenre(results, genre);
            const hasStrongLocalMatch = resultsWithScores.length > 0 && resultsWithScores[0].score >= 20;
            if (!hasStrongLocalMatch && normalized.length > 2) {
                this.logger.log(`Live TMDB Fallback Search triggered for: "${query}"`);
                try {
                    const tmdbSearch = await this.tmdb("search/multi", {
                        query: normalized,
                    });
                    if (tmdbSearch.results && tmdbSearch.results.length > 0) {
                        const topHits = tmdbSearch.results
                            .slice(0, 5)
                            .filter((m) => m.media_type === "movie" || m.media_type === "tv");
                        const liveResults = [];
                        await Promise.all(topHits.map(async (hit) => {
                            const providers = await this.tmdb(`${hit.media_type}/${hit.id}/watch/providers`).catch((e) => {
                                this.logger.error(`Failed to fetch providers for ${hit.id}`, e);
                                return null;
                            });
                            const usProviders = providers?.results?.["US"]?.flatrate || [];
                            const inProviders = providers?.results?.["IN"]?.flatrate || [];
                            const allProviderIds = Array.from(new Set([...usProviders, ...inProviders].map((p) => String(p.provider_id))));
                            const availableOn = [];
                            if (allProviderIds.includes(this.providerMap["netflix"]))
                                availableOn.push("Netflix");
                            if (allProviderIds.includes(this.providerMap["prime"]))
                                availableOn.push("Prime Video");
                            if (allProviderIds.includes(this.providerMap["hotstar"]))
                                availableOn.push("Hotstar");
                            if (allProviderIds.includes(this.providerMap["appletv"]))
                                availableOn.push("Apple TV+");
                            if (allProviderIds.includes(this.providerMap["zee5"]))
                                availableOn.push("Zee5");
                            if (allProviderIds.includes(this.providerMap["sonyliv"]))
                                availableOn.push("Sony LIV");
                            if (allProviderIds.includes(this.providerMap["jio"]))
                                availableOn.push("JioCinema");
                            const movieObj = this.toMovie(hit, hit.media_type);
                            movieObj.availablePlatforms =
                                availableOn.length > 0 ? availableOn : ["Other"];
                            this.state[platform].movies.set(movieObj.id, movieObj);
                            this.state[platform].tmdbIdIndex.set(movieObj.tmdbId, movieObj.id);
                            liveResults.push(movieObj);
                        }));
                        const uniqueLiveResults = liveResults.filter((lr) => !results.some((r) => r.tmdbId === lr.tmdbId));
                        results.unshift(...uniqueLiveResults);
                    }
                }
                catch (e) {
                    this.logger.error("TMDB Live Fallback Search failed: " +
                        (e instanceof Error ? e.message : String(e)));
                }
            }
            const resultObj = { movies: results, actor: undefined };
            if (this.state[platform].searchCache.size > 100) {
                const firstKey = this.state[platform].searchCache.keys().next().value;
                if (firstKey)
                    this.state[platform].searchCache.delete(firstKey);
            }
            this.state[platform].searchCache.set(cacheKey, resultObj);
            return resultObj;
        }
        catch (err) {
            this.logger.warn(`Search failed for "${query}": ${err}`);
            return { movies: [] };
        }
    }
    filterGenre(titles, genre) {
        return genre && genre !== "All"
            ? titles.filter((item) => item.genres && item.genres.includes(genre))
            : titles;
    }
    async getSimilarMovies(id, platform = "netflix") {
        await this.ensureCatalog(platform);
        const current = await this.getMovieById(id, platform);
        const allMovies = await this.getAllMovies(platform);
        let similar = [];
        const titleParts = current.title.split(/[:\-]/);
        const mainKeyword = titleParts[0].trim().toLowerCase();
        if (mainKeyword.length > 3) {
            const titleMatches = allMovies.filter((m) => m.id !== current.id && m.title.toLowerCase().includes(mainKeyword));
            similar.push(...titleMatches);
        }
        try {
            if (mainKeyword.length > 3) {
                try {
                    const franchiseSearch = await this.tmdb("search/multi", {
                        query: mainKeyword,
                    });
                    if (franchiseSearch && franchiseSearch.results) {
                        const franchiseHits = franchiseSearch.results
                            .filter((m) => (m.media_type === "movie" || m.media_type === "tv") &&
                            String(m.id) !== current.tmdbId)
                            .slice(0, 5)
                            .map((item) => this.toMovie(item, item.media_type));
                        this.logger.log(`Franchise search found ${franchiseHits.length} hits for keyword: ${mainKeyword}`);
                        similar.push(...franchiseHits);
                    }
                }
                catch (e) {
                    this.logger.error("Franchise search failed", e);
                }
            }
            const type = current.isSeries ? "tv" : "movie";
            const recs = await this.tmdb(`${type}/${current.tmdbId}/recommendations`);
            if (recs && recs.results) {
                similar.push(...recs.results
                    .slice(0, 8)
                    .map((item) => this.toMovie(item, type)));
            }
            const sim = await this.tmdb(`${type}/${current.tmdbId}/similar`);
            if (sim && sim.results) {
                similar.push(...sim.results
                    .slice(0, 8)
                    .map((item) => this.toMovie(item, type)));
            }
        }
        catch (e) {
            this.logger.warn(`Failed to fetch true similar movies for ${id}: ${e}`);
        }
        const genreMatches = allMovies
            .filter((item) => item.id !== current.id &&
            item.genres.some((genre) => current.genres.includes(genre)))
            .slice(0, 10);
        similar.push(...genreMatches);
        const uniqueMap = new Map();
        similar.forEach((m) => {
            const key = m.tmdbId || m.id;
            if (!uniqueMap.has(key) && key !== (current.tmdbId || current.id)) {
                uniqueMap.set(key, m);
            }
        });
        return Array.from(uniqueMap.values()).slice(0, 16);
    }
    async getRecommendations(id, platform = "netflix") {
        await this.ensureCatalog(platform);
        let source;
        try {
            source = await this.getMovieById(id, platform);
        }
        catch (e) {
            this.logger.error(`Failed to get movie by ID ${id} in getRecommendations`, e);
            return [];
        }
        const allMovies = await this.getAllMovies(platform);
        const scored = allMovies
            .filter((m) => m.id !== source.id)
            .map((m) => {
            let score = 0;
            const genreOverlap = m.genres.filter((g) => source.genres.includes(g)).length;
            score += genreOverlap * 20;
            if (source.director &&
                m.director &&
                source.director !== "Unknown" &&
                m.director !== "Unknown") {
                if (source.director.toLowerCase() === m.director.toLowerCase())
                    score += 15;
            }
            const sourceCastNames = source.cast
                .map((c) => typeof c === "string"
                ? c.toLowerCase()
                : c.name?.toLowerCase() || "")
                .filter(Boolean);
            const targetCastNames = m.cast
                .map((c) => typeof c === "string"
                ? c.toLowerCase()
                : c.name?.toLowerCase() || "")
                .filter(Boolean);
            const castOverlap = sourceCastNames.filter((n) => targetCastNames.includes(n)).length;
            score += Math.min(castOverlap * 10, 30);
            if (Math.abs(m.releaseYear - source.releaseYear) <= 10)
                score += 5;
            if (Math.abs(m.matchScore - source.matchScore) <= 15)
                score += 10;
            if (m.isTrending || m.isPopular || m.isTop10)
                score += 5;
            if (m.isSeries === source.isSeries)
                score += 8;
            if (m.isAnime === source.isAnime)
                score += 5;
            return { ...m, _score: score };
        })
            .filter((m) => m._score > 0)
            .sort((a, b) => b._score - a._score)
            .slice(0, 20)
            .map(({ _score: _, ...m }) => m);
        return scored;
    }
    async getIntroTimings(id, season, episode, platform = "netflix") {
        try {
            await this.ensureCatalog(platform);
            const movie = await this.getMovieById(id, platform);
            if (!movie.isSeries || !season || !episode) {
                return { hasIntro: false, startSeconds: 0, endSeconds: 0 };
            }
            // Use a consistent but reasonable intro duration
            // Most TV shows have intros between 60-90 seconds
            // We return a conservative estimate since we don't have real data
            return {
                hasIntro: false, // Don't show skip intro button without real data
                startSeconds: 0,
                endSeconds: 0,
            };
        }
        catch (e) {
            this.logger.error(`Failed to get intro timings for ${id}`, e);
            return { hasIntro: false, startSeconds: 0, endSeconds: 0 };
        }
    }
    async getExternalIds(id, platform = "netflix") {
        const movie = await this.getMovieById(id, platform);
        if (!movie || !movie.tmdbId)
            return {};
        try {
            const type = movie.isSeries ? "tv" : "movie";
            return await this.tmdb(`${type}/${movie.tmdbId}/external_ids`);
        }
        catch (e) {
            this.logger.error(`Failed to fetch external ids for ${movie.tmdbId}`, e);
            return {};
        }
    }
    async getPersonDetails(personId) {
        try {
            const details = await this.tmdb(`person/${personId}`, {
                append_to_response: "combined_credits",
            });
            const credits = (details.combined_credits?.cast || [])
                .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                .slice(0, 24)
                .map((item) => this.toMovie(item, item.media_type || "movie"));
            return {
                id: details.id,
                name: details.name,
                biography: details.biography,
                profileUrl: details.profile_path
                    ? this.image(details.profile_path, "w500")
                    : null,
                knownFor: details.known_for_department,
                birthday: details.birthday,
                placeOfBirth: details.place_of_birth,
                credits,
            };
        }
        catch (e) {
            this.logger.error(`Failed to fetch person details for ${personId}`, e);
            throw e;
        }
    }
    async getStreamUrl(id, serverIndex = 0, season, episode, platform = "netflix") {
        const numericId = id.replace(/^tmdb-(tv|movie)-/, "");
        const SERVERS = [
            {
                url: (tmdbId, s, e) => s
                    ? `https://vidlink.pro/tv/${tmdbId}/${s}/${e}`
                    : `https://vidlink.pro/movie/${tmdbId}`,
            },
            {
                url: (tmdbId, s, e) => s
                    ? `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}`
                    : `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}`,
            },
            {
                url: (tmdbId, s, e) => s
                    ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}`
                    : `https://www.2embed.cc/embed/${tmdbId}`,
            },
            {
                url: (tmdbId, s, e) => s
                    ? `https://vidsrc.pro/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}`
                    : `https://vidsrc.pro/embed/movie?tmdb=${tmdbId}`,
            },
        ];
        const idx = serverIndex >= 0 && serverIndex < SERVERS.length ? serverIndex : 0;
        const url = SERVERS[idx].url(numericId, season, episode);
        return { url };
    }
};
exports.MoviesService = MoviesService;
exports.MoviesService = MoviesService = MoviesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], MoviesService);
//# sourceMappingURL=movies.service.js.map