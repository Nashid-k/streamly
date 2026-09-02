import { StreamAdapter, ResolvedStream } from "./adapter.interface";
import { BaseAdapter } from "./base.adapter";
export declare class VidsrcInAdapter extends BaseAdapter implements StreamAdapter {
    name: string;
    index: number;
    resolve(tmdbId: string, type: "movie" | "tv", season?: number, episode?: number): Promise<ResolvedStream | null>;
}
