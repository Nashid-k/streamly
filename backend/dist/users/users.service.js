"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const firestore_adapter_1 = require("./adapters/firestore.adapter");
const json_adapter_1 = require("./adapters/json.adapter");
let UsersService = UsersService_1 = class UsersService {
    constructor() {
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async onModuleInit() {
        const useFirestore = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL;
        if (useFirestore) {
            this.logger.log("Initializing Firestore User Adapter");
            this.adapter = new firestore_adapter_1.FirestoreAdapter();
        }
        else {
            this.logger.log("Initializing Legacy JSON User Adapter");
            this.adapter = new json_adapter_1.JsonAdapter();
        }
        await this.adapter.init();
    }
    getUser() {
        return this.adapter.getUser();
    }
    setCurrentProfile(profileId) {
        return this.adapter.setCurrentProfile(profileId);
    }
    getMyList() {
        return this.adapter.getMyList();
    }
    toggleMyList(movieId) {
        return this.adapter.toggleMyList(movieId);
    }
    updatePreferences(preferences) {
        return this.adapter.updatePreferences(preferences);
    }
    getContinueWatching() {
        return this.adapter.getContinueWatching();
    }
    updateContinueWatching(item) {
        return this.adapter.updateContinueWatching(item);
    }
    removeContinueWatching(movieId) {
        return this.adapter.removeContinueWatching(movieId);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map