export class CdnImageAdapter {
  // Toggle this to use a proxy like Cloudflare, Cloudinary, etc.
  static USE_PROXY = false;
  static PROXY_BASE = "https://your-cloudfront-url.net/";

  /**
   * Transforms a raw TMDB image path into an optimized URL.
   * @param {string} path - TMDB path (e.g., /mBaXZMacxFzji9moQh2Tgw75a34.jpg)
   * @param {string} size - Size string (e.g., 'w500', 'original', 'w92')
   */
  static getUrl(path, size = "w500") {
    if (!path) return null;

    // If it's already a full URL, return it
    if (path.startsWith("http")) {
      if (this.USE_PROXY && path.includes("image.tmdb.org")) {
        return path.replace("https://image.tmdb.org/t/p/", this.PROXY_BASE);
      }
      return path;
    }

    // Clean path
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;

    if (this.USE_PROXY) {
      return `${this.PROXY_BASE}${size}/${cleanPath}`;
    }

    return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
  }

  /**
   * Generates a tiny, highly compressed version of the image for blur-up loading.
   */
  static getTinyUrl(path) {
    return this.getUrl(path, "w92");
  }

  /**
   * Generates a small thumbnail URL for search dropdowns and small cards.
   */
  static getSmallUrl(path) {
    return this.getUrl(path, "w154");
  }

  /**
   * Generates a medium URL for card posters (default w500 is fine for cards).
   */
  static getMediumUrl(path) {
    return this.getUrl(path, "w342");
  }
}
