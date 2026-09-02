"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonAdapter = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
class JsonAdapter {
    constructor() {
        this.logger = new common_1.Logger(JsonAdapter.name);
        this.isWriting = false;
        this.pendingWrite = false;
        this.statePath = process.env.USER_STATE_FILE || (0, node_path_1.join)(process.cwd(), "data", "user.json");
        this.user = {
            id: process.env.DEFAULT_USER_ID || "guest",
            email: process.env.DEFAULT_USER_EMAIL || "user@netflix.com",
            name: process.env.DEFAULT_USER_NAME || "Streamer",
            profiles: [
                {
                    id: "prof-1",
                    name: "Classic",
                    avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png",
                    isKids: false,
                },
                {
                    id: "prof-2",
                    name: "Kids",
                    avatarUrl: "https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-88osjt27xavuhybs.jpg",
                    isKids: true,
                },
            ],
            currentProfileId: "prof-1",
            myList: [],
            continueWatching: [],
        };
    }
    async init() {
        try {
            const contents = await (0, promises_1.readFile)(this.statePath, "utf8");
            const saved = JSON.parse(contents);
            if (Array.isArray(saved.myList))
                this.user.myList = saved.myList.filter((id) => typeof id === "string");
            if (Array.isArray(saved.continueWatching)) {
                this.user.continueWatching = saved.continueWatching.filter((item) => item &&
                    typeof item.movieId === "string" &&
                    typeof item.progressSeconds === "number");
            }
            if (typeof saved.currentProfileId === "string" &&
                this.user.profiles.some((p) => p.id === saved.currentProfileId)) {
                this.user.currentProfileId = saved.currentProfileId;
            }
            if (saved.preferencesByProfile &&
                typeof saved.preferencesByProfile === "object") {
                this.user.preferencesByProfile = saved.preferencesByProfile;
            }
        }
        catch (error) {
            if (error?.code !== "ENOENT")
                this.logger.warn(`Could not restore user state: ${error?.message}`);
        }
    }
    async persist() {
        if (this.isWriting) {
            this.pendingWrite = true;
            return;
        }
        this.isWriting = true;
        try {
            const data = JSON.stringify({
                currentProfileId: this.user.currentProfileId,
                myList: this.user.myList,
                continueWatching: this.user.continueWatching,
                preferencesByProfile: this.user.preferencesByProfile,
            });
            const directory = (0, node_path_1.join)(this.statePath, "..");
            await (0, promises_1.mkdir)(directory, { recursive: true });
            await (0, promises_1.writeFile)(`${this.statePath}.tmp`, data, "utf8");
            await (0, promises_1.rename)(`${this.statePath}.tmp`, this.statePath);
        }
        catch (error) {
            this.logger.error(`Could not persist user state: ${error.message}`);
        }
        finally {
            this.isWriting = false;
            if (this.pendingWrite) {
                this.pendingWrite = false;
                this.persist();
            }
        }
    }
    getUser() {
        return this.user;
    }
    setCurrentProfile(profileId) {
        const target = this.user.profiles.find((p) => p.id === profileId);
        if (target) {
            this.user.currentProfileId = profileId;
            this.persist();
            return target;
        }
        return this.user.profiles[0];
    }
    getMyList() {
        return this.user.myList;
    }
    toggleMyList(movieId) {
        const index = this.user.myList.indexOf(movieId);
        let isSaved = false;
        if (index >= 0) {
            this.user.myList.splice(index, 1);
        }
        else {
            this.user.myList.push(movieId);
            isSaved = true;
        }
        this.persist();
        return { myList: this.user.myList, isSaved };
    }
    updatePreferences(preferences) {
        this.user.preferencesByProfile ||= {};
        this.user.preferencesByProfile[this.user.currentProfileId] = preferences;
        this.persist();
        return this.user.preferencesByProfile[this.user.currentProfileId];
    }
    getContinueWatching() {
        return (this.user.continueWatching || []).sort((a, b) => b.updatedAt - a.updatedAt);
    }
    updateContinueWatching(item) {
        this.user.continueWatching = this.user.continueWatching || [];
        const idx = this.user.continueWatching.findIndex((c) => c.movieId === item.movieId);
        if (idx >= 0) {
            this.user.continueWatching[idx] = item;
        }
        else {
            this.user.continueWatching.unshift(item);
        }
        this.user.continueWatching = this.user.continueWatching
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 20);
        this.persist();
        return this.user.continueWatching;
    }
    removeContinueWatching(movieId) {
        this.user.continueWatching = (this.user.continueWatching || []).filter((c) => c.movieId !== movieId);
        this.persist();
        return this.user.continueWatching;
    }
}
exports.JsonAdapter = JsonAdapter;
//# sourceMappingURL=json.adapter.js.map