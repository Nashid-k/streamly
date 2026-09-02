"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAdapter = void 0;
class BaseAdapter {
    constructor() {
        this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    }
    async fetchHtml(url, referer, extraHeaders = {}) {
        try {
            const headers = {
                "User-Agent": this.userAgent,
                ...extraHeaders,
            };
            if (referer) {
                headers["Referer"] = referer;
            }
            const res = await fetch(url, {
                headers,
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok)
                return "";
            return await res.text();
        }
        catch (e) {
            return "";
        }
    }
    extractM3u8(html) {
        const match = html.match(/(?:source|file|src|url)["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
        if (match)
            return match[1];
        const plainMatch = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
        if (plainMatch)
            return plainMatch[0];
        return null;
    }
    decodeBase64(str) {
        try {
            return Buffer.from(str, "base64").toString("utf8");
        }
        catch (e) {
            return "";
        }
    }
    resolveUrl(relative, base) {
        try {
            return new URL(relative, base).href;
        }
        catch (e) {
            return relative;
        }
    }
    rot13(str) {
        return str.replace(/[a-zA-Z]/g, function (c) {
            const base = c <= "Z" ? 65 : 97;
            return String.fromCharCode(base + ((c.charCodeAt(0) - base + 13) % 26));
        });
    }
}
exports.BaseAdapter = BaseAdapter;
//# sourceMappingURL=base.adapter.js.map