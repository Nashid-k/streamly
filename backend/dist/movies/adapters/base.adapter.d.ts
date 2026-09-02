export declare class BaseAdapter {
    protected readonly userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    protected fetchHtml(url: string, referer?: string, extraHeaders?: Record<string, string>): Promise<string>;
    protected extractM3u8(html: string): string | null;
    protected decodeBase64(str: string): string;
    protected resolveUrl(relative: string, base: string): string;
    protected rot13(str: string): string;
}
