export interface ResolvedStream {
    manifestUrl: string;
    type: "hls" | "mp4" | "raw";
    headers: Record<string, string>;
    referer: string;
    expiresAt: number;
    serverName: string;
    serverIndex: number;
}
export interface StreamAdapter {
    name: string;
    index: number;
    resolve(tmdbId: string, type: "movie" | "tv", season?: number, episode?: number): Promise<ResolvedStream | null>;
}
