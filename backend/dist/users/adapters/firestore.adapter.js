"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreAdapter = void 0;
const common_1 = require("@nestjs/common");
const firestore_1 = require("firebase-admin/firestore");
class FirestoreAdapter {
    constructor() {
        this.logger = new common_1.Logger(FirestoreAdapter.name);
        this.uid = "guest";
        this.user = {
            id: "guest",
            email: "user@netflix.com",
            name: "Streamer",
            profiles: [{ id: "prof-1", name: "Classic", avatarUrl: "", isKids: false }],
            currentProfileId: "prof-1",
            myList: [],
            continueWatching: [],
        };
    }
    async init() {
        this.db = (0, firestore_1.getFirestore)();
        try {
            const doc = await this.db.collection("users").doc(this.uid).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.myList)
                    this.user.myList = data.myList;
                if (data.continueWatching)
                    this.user.continueWatching = data.continueWatching;
                if (data.preferencesByProfile)
                    this.user.preferencesByProfile = data.preferencesByProfile;
            }
            else {
                await this.db.collection("users").doc(this.uid).set({
                    myList: [],
                    continueWatching: [],
                    preferencesByProfile: {},
                });
            }
        }
        catch (e) {
            this.logger.warn(`Firestore User init failed: ${e.message}`);
        }
    }
    getUser() {
        return this.user;
    }
    setCurrentProfile(profileId) {
        this.user.currentProfileId = profileId;
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
            this.db
                .collection("users")
                .doc(this.uid)
                .update({ myList: firestore_1.FieldValue.arrayRemove(movieId) })
                .catch((e) => this.logger.error(`Firestore toggleMyList remove failed: ${e.message}`));
        }
        else {
            this.user.myList.push(movieId);
            this.db
                .collection("users")
                .doc(this.uid)
                .update({ myList: firestore_1.FieldValue.arrayUnion(movieId) })
                .catch((e) => this.logger.error(`Firestore toggleMyList add failed: ${e.message}`));
            isSaved = true;
        }
        return { myList: this.user.myList, isSaved };
    }
    updatePreferences(preferences) {
        this.user.preferencesByProfile ||= {};
        this.user.preferencesByProfile[this.user.currentProfileId] = preferences;
        this.db
            .collection("users")
            .doc(this.uid).update({ preferencesByProfile: this.user.preferencesByProfile })
                .catch((e) => this.logger.error(`Firestore updatePreferences failed: ${e.message}`));
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
        this.db
            .collection("users")
            .doc(this.uid).update({ continueWatching: this.user.continueWatching })
                .catch((e) => this.logger.error(`Firestore updateContinueWatching failed: ${e.message}`));
        return this.user.continueWatching;
    }
    removeContinueWatching(movieId) {
        this.user.continueWatching = (this.user.continueWatching || []).filter((c) => c.movieId !== movieId);
        this.db
            .collection("users")
            .doc(this.uid)
            .update({ continueWatching: this.user.continueWatching })
            .catch((e) => this.logger.error(`Firestore removeContinueWatching failed: ${e.message}`));
        return this.user.continueWatching;
    }
}
exports.FirestoreAdapter = FirestoreAdapter;
//# sourceMappingURL=firestore.adapter.js.map