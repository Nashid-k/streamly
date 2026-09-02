"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationAdapter = void 0;
const common_1 = require("@nestjs/common");
const messaging_1 = require("firebase-admin/messaging");
const app_1 = require("firebase-admin/app");
class PushNotificationAdapter {
    constructor() {
        this.logger = new common_1.Logger(PushNotificationAdapter.name);
        this.initialized = false;
        try {
            if ((0, app_1.getApps)().length > 0) {
                this.messaging = (0, messaging_1.getMessaging)();
                this.initialized = true;
            }
        }
        catch (e) {
            this.logger.warn("Firebase admin not initialized, push notifications disabled.");
        }
    }
    async sendToUser(fcmToken, title, body, imageUrl, deepLink) {
        if (!this.initialized)
            return;
        try {
            await this.messaging.send({
                token: fcmToken,
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl }),
                },
                data: {
                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                    ...(deepLink && { deepLink }),
                },
                android: {
                    priority: "high",
                    notification: {
                        sound: "default",
                        channelId: "new_releases",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
            });
            this.logger.log(`Push notification sent to ${fcmToken}`);
        }
        catch (e) {
            this.logger.error(`Failed to send push notification: ${e.message}`);
        }
    }
    async broadcastNewRelease(movieTitle, platform, movieId) {
        if (!this.initialized)
            return;
        try {
            await this.messaging.send({
                topic: "new_releases",
                notification: {
                    title: `New on ${platform}!`,
                    body: `${movieTitle} is now streaming on ${platform}. Tap to watch now!`,
                },
                data: {
                    movieId: movieId.toString(),
                    action: "open_movie",
                },
            });
            this.logger.log(`Broadcasted new release push notification for ${movieTitle}`);
        }
        catch (e) {
            this.logger.error(`Failed to broadcast push notification: ${e.message}`);
        }
    }
}
exports.PushNotificationAdapter = PushNotificationAdapter;
//# sourceMappingURL=push-notification.adapter.js.map