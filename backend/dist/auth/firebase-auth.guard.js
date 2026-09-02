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
var FirebaseAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const firebase_module_1 = require("../firebase/firebase.module");
let FirebaseAuthGuard = FirebaseAuthGuard_1 = class FirebaseAuthGuard {
    constructor(firebase) {
        this.firebase = firebase;
        this.logger = new common_1.Logger(FirebaseAuthGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new common_1.UnauthorizedException("Missing or invalid Authorization header.");
        }
        const token = authHeader.slice(7);
        try {
            const decoded = await this.firebase.verifyIdToken(token);
            request.user = decoded;
            return true;
        }
        catch (err) {
            this.logger.warn(`Auth guard rejected token: ${err?.message}`);
            throw new common_1.UnauthorizedException("Invalid or expired Firebase token.");
        }
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = FirebaseAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_module_1.FirebaseAdminService])
], FirebaseAuthGuard);
//# sourceMappingURL=firebase-auth.guard.js.map