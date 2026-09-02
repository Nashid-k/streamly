import { Movie } from "./movies.types";
export type PlatformKey = "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio";
export declare class PlatformState {
    movies: Map<string, Movie>;
    tmdbIdIndex: Map<string, string>;
    titleIndex: Map<string, string[]>;
    genreIndex: Map<string, string[]>;
    categories: any[];
    realRecentlyAddedTmdbIds: Set<string>;
    realLeavingSoonTmdbIds: Set<string>;
    lastRefreshAttemptAt: number;
    refreshInFlight: Promise<void> | null;
    searchCache: Map<string, {
        movies: Movie[];
        actor?: any;
    }>;
}
export declare const PLATFORM_LABELS: Record<PlatformKey, string>;
export declare const ALL_PLATFORMS: PlatformKey[];
