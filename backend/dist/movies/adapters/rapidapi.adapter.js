"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RapidApiAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
class RapidApiAdapter {
    constructor(apiKey, requestTimeoutMs = 8000) {
        this.apiKey = apiKey;
        this.requestTimeoutMs = requestTimeoutMs;
    }
    async getChanges(serviceName, changeType, itemType = "show") {
        if (!this.apiKey)
            return null;
        try {
            const response = await (0, axios_1.default)({
                url: `https://streaming-availability.p.rapidapi.com/changes?country=us&services=${serviceName}&change_type=${changeType}&item_type=${itemType}`,
                method: "GET",
                headers: {
                    "x-rapidapi-key": this.apiKey,
                    "x-rapidapi-host": "streaming-availability.p.rapidapi.com",
                    Accept: "application/json",
                },
                timeout: this.requestTimeoutMs,
            });
            return response.data;
        }
        catch (err) {
            console.warn(`RapidAPI ${serviceName} ${changeType} fetch failed.`);
            return null;
        }
    }
}
exports.RapidApiAdapter = RapidApiAdapter;
//# sourceMappingURL=rapidapi.adapter.js.map