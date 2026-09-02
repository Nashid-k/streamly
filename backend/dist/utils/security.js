"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeUrl = isSafeUrl;
const url_1 = require("url");
function isSafeUrl(targetUrl) {
    if (!targetUrl)
        return false;
    try {
        const parsed = new url_1.URL(targetUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return false;
        }
        const hostname = parsed.hostname;
        if (hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "[::1]") {
            return false;
        }
        if (hostname === "169.254.169.254") {
            return false;
        }
        if (/^10\./.test(hostname) ||
            /^192\.168\./.test(hostname) ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
            return false;
        }
        return true;
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=security.js.map