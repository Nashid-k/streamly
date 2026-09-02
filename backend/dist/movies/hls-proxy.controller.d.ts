import { Response } from "express";
import { StreamResolverService } from "./stream-resolver.service";
export declare class HlsProxyController {
    private readonly streamResolver;
    constructor(streamResolver: StreamResolverService);
    resolve(tmdbId: string, type: "movie" | "tv", season?: string, episode?: string, serverIndex?: string): Promise<{
        proxyManifestUrl: string;
        serverName: string;
        serverIndex: number;
        cached: boolean;
    }>;
    proxy(url: string, ref: string, res: Response): Promise<void>;
}
