export declare class RapidApiAdapter {
    private readonly apiKey;
    private readonly requestTimeoutMs;
    constructor(apiKey: string, requestTimeoutMs?: number);
    getChanges(serviceName: string, changeType: "new" | "expiring", itemType?: "show" | "movie"): Promise<any>;
}
