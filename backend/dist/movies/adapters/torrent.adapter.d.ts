import { StreamAdapter, ResolvedStream } from './adapter.interface';
export declare class TorrentAdapter implements StreamAdapter {
    name: string;
    index: number;
    resolve(tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number): Promise<ResolvedStream | null>;
}
