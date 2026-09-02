"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const firebase_module_1 = require("../firebase/firebase.module");
let AuthService = AuthService_1 = class AuthService {
    constructor(firebase) {
        this.firebase = firebase;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async verifyToken(idToken) {
        try {
            return await this.firebase.verifyIdToken(idToken);
        }
        catch (err) {
            this.logger.warn(`Token verification failed: ${err?.message}`);
            throw new common_1.UnauthorizedException("Invalid or expired Firebase token.");
        }
    }
    async getProfile(uid) {
        const user = await this.firebase.auth.getUser(uid);
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: user.metadata.creationTime,
        };
    }
    userRef(uid) {
        return this.firebase.firestore.collection("users").doc(uid);
    }
    async getContinueWatching(uid) {
        const snap = await this.userRef(uid).get();
        if (!snap.exists)
            return [];
        const data = snap.data() ?? {};
        const list = data["continueWatching"] ?? [];
        return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    async updateContinueWatching(uid, item) {
        const ref = this.userRef(uid);
        const snap = await ref.get();
        const existing = snap.exists
            ? (snap.data()?.["continueWatching"] ?? [])
            : [];
        const filtered = existing.filter((c) => c.movieId !== item.movieId);
        const updated = [item, ...filtered]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 20);
        await ref.set({ continueWatching: updated }, { merge: true });
        return updated;
    }
    async removeContinueWatching(uid, movieId) {
        const ref = this.userRef(uid);
        const snap = await ref.get();
        const existing = snap.exists
            ? (snap.data()?.["continueWatching"] ?? [])
            : [];
        const updated = existing.filter((c) => c.movieId !== movieId);
        await ref.set({ continueWatching: updated }, { merge: true });
        return updated;
    }
    async getMyList(uid) {
        const snap = await this.userRef(uid).get();
        if (!snap.exists)
            return [];
        return snap.data()?.["myList"] ?? [];
    }
    async toggleMyList(uid, movie) {
        const ref = this.userRef(uid);
        const snap = await ref.get();
        const existing = snap.exists ? (snap.data()?.["myList"] ?? []) : [];
        const idx = existing.findIndex((m) => m.id === movie.id);
        const isSaved = idx === -1;
        const updated = isSaved
            ? [...existing, movie]
            : existing.filter((m) => m.id !== movie.id);
        await ref.set({ myList: updated }, { merge: true });
        return { myList: updated, isSaved };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_module_1.FirebaseAdminService])
], AuthService);
//# sourceMappingURL=auth.service.js.map