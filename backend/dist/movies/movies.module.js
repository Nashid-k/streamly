"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesModule = void 0;
const common_1 = require("@nestjs/common");
const movies_controller_1 = require("./movies.controller");
const stream_controller_1 = require("./stream.controller");
const movies_service_1 = require("./movies.service");
const stream_resolver_service_1 = require("./stream-resolver.service");
const hls_proxy_controller_1 = require("./hls-proxy.controller");
const firebase_module_1 = require("../firebase/firebase.module");
const firebase_auth_guard_1 = require("../auth/firebase-auth.guard");
let MoviesModule = class MoviesModule {
};
exports.MoviesModule = MoviesModule;
exports.MoviesModule = MoviesModule = __decorate([
    (0, common_1.Module)({
        imports: [firebase_module_1.FirebaseModule],
        controllers: [movies_controller_1.MoviesController, stream_controller_1.StreamController, hls_proxy_controller_1.HlsProxyController],
        providers: [movies_service_1.MoviesService, stream_resolver_service_1.StreamResolverService, firebase_auth_guard_1.FirebaseAuthGuard],
        exports: [movies_service_1.MoviesService],
    })
], MoviesModule);
//# sourceMappingURL=movies.module.js.map