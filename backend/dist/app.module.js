"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const movies_module_1 = require("./movies/movies.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const firebase_module_1 = require("./firebase/firebase.module");
const app_controller_1 = require("./app.controller");
const Joi = __importStar(require("joi"));
const config_1 = require("@nestjs/config");
const redis_1 = __importDefault(require("@keyv/redis"));
const cacheConfig = cache_manager_1.CacheModule.registerAsync({
    isGlobal: true,
    inject: [config_1.ConfigService],
    useFactory: async (configService) => {
        const redisUrl = configService.get("REDIS_URL");
        if (redisUrl) {
            try {
                const store = new redis_1.default(redisUrl);
                store.on("error", (err) => common_1.Logger.warn(`Redis connection error: ${err.message}. Falling back to memory cache.`));
                common_1.Logger.log("Successfully initialized Distributed Redis Cache");
                return {
                    store: store,
                    ttl: 4 * 60 * 60 * 1000,
                };
            }
            catch (error) {
                common_1.Logger.warn(`Failed to connect to Redis: ${error.message}. Falling back to in-memory cache.`);
            }
        }
        common_1.Logger.log("Initialized Local Memory Cache");
        return {
            ttl: 4 * 60 * 60 * 1000,
        };
    },
});
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: Joi.object({
                    PORT: Joi.number().default(4000),
                    TMDB_API_KEY: Joi.string().required(),
                    TMDB_READ_TOKEN: Joi.string().optional(),
                    RAPIDAPI_KEY: Joi.string().optional(),
                    FRONTEND_URL: Joi.string().default("http://localhost:3000"),
                    FIREBASE_PROJECT_ID: Joi.string().required(),
                    FIREBASE_CLIENT_EMAIL: Joi.string().required(),
                    FIREBASE_PRIVATE_KEY: Joi.string().required(),
                }),
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 10000,
                    limit: 30,
                },
            ]),
            cacheConfig,
            firebase_module_1.FirebaseModule,
            movies_module_1.MoviesModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map