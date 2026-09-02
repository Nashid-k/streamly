"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const core_1 = require("@nestjs/core");
const compression = require("compression");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
(0, dotenv_1.config)({ path: (0, path_1.join)(__dirname, "..", ".env") });
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use(compression());
    app.use((0, helmet_1.default)());
    const defaultOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost",
        "capacitor://localhost",
    ];
    const frontendUrl = configService.get("FRONTEND_URL");
    const envOrigins = frontendUrl
        ? frontendUrl
            .split(",")
            .map((url) => url.trim())
            .filter(Boolean)
            .map((url) => (url.startsWith("http") ? url : `https://${url}`))
        : [];
    const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
    app.enableCors({
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            }
            // Allow any Vercel preview URL
            if (origin && origin.includes('.vercel.app')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
        exposedHeaders: ["Cache-Control"],
        credentials: true,
    });
    const port = configService.get("PORT") || 4000;
    await app.listen(port, "0.0.0.0");
    console.log(`🚀 NestJS Backend running on port: ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map