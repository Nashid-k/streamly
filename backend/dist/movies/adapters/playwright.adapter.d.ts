import { StreamAdapter, ResolvedStream } from './adapter.interface';
import { BaseAdapter } from './base.adapter';
export declare class PlaywrightAdapter extends BaseAdapter implements StreamAdapter {
    name: string;
    index: number;
    private targetBaseUrl;
    constructor(targetBaseUrl: string);
    resolve(tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number): Promise<ResolvedStream | null>;
}
