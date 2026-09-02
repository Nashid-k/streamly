import { Request, Response } from "express";
export declare class StreamController {
    private readonly logger;
    private engines;
    private readonly ENGINE_TTL_MS;
    private destroyEngine;
    private getOrCreateEngine;
    streamTorrent(magnet: string, title: string, year: string, req: Request, res: Response): Promise<void>;
}
