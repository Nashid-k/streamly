export declare class PushNotificationAdapter {
    private readonly logger;
    private messaging;
    private initialized;
    constructor();
    sendToUser(fcmToken: string, title: string, body: string, imageUrl?: string, deepLink?: string): Promise<void>;
    broadcastNewRelease(movieTitle: string, platform: string, movieId: string): Promise<void>;
}
