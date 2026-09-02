import { ResolvedStream } from "./adapters/adapter.interface";
export declare class StreamResolverService {
    private adapters;
    private cache;
    constructor();
    resolve(tmdbId: string, type: "movie" | "tv", season?: number, episode?: number, preferredServerIndex?: number): Promise<ResolvedStream>;
}
