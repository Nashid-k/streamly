import { describe, it, expect } from "vitest";
import { normalizePlatformKey, normalizeMovieSource, PLATFORMS } from "../api/platformAdapter";

describe("platformAdapter normalization deep edge cases", () => {
  describe("normalizePlatformKey comprehensive", () => {
    it("returns null for null input", () => {
      expect(normalizePlatformKey(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(normalizePlatformKey(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(normalizePlatformKey("")).toBeNull();
    });

    it("returns null for whitespace-only input", () => {
      expect(normalizePlatformKey("   ")).toBeNull();
    });

    it("returns null for only special characters", () => {
      expect(normalizePlatformKey("@#$%")).toBeNull();
    });

    it("normalizes 'Netflix' to 'netflix'", () => {
      expect(normalizePlatformKey("Netflix")).toBe("netflix");
    });

    it("normalizes 'NETFLIX' to 'netflix'", () => {
      expect(normalizePlatformKey("NETFLIX")).toBe("netflix");
    });

    it("normalizes 'Hotstar' to 'hotstar'", () => {
      expect(normalizePlatformKey("Hotstar")).toBe("hotstar");
    });

    it("normalizes 'JioCinema' to 'jio'", () => {
      expect(normalizePlatformKey("JioCinema")).toBe("jio");
    });

    it("normalizes 'SonyLIV' to 'sonyliv'", () => {
      expect(normalizePlatformKey("SonyLIV")).toBe("sonyliv");
    });

    it("normalizes 'ZEE5' to 'zee5'", () => {
      expect(normalizePlatformKey("ZEE5")).toBe("zee5");
    });

    it("normalizes 'MX Player' to 'mxplayer'", () => {
      expect(normalizePlatformKey("MX Player")).toBe("mxplayer");
    });

    it("handles numeric input gracefully", () => {
      const result = normalizePlatformKey(123);
      expect(typeof result === "string" || result === null).toBe(true);
    });

    it("handles boolean input gracefully", () => {
      const result = normalizePlatformKey(true);
      expect(typeof result === "string" || result === null).toBe(true);
    });

    it("returns null for unknown platform", () => {
      expect(normalizePlatformKey("UnknownPlatformXYZ")).toBeNull();
    });

    it("handles very long string input", () => {
      const longString = "a".repeat(10000);
      const result = normalizePlatformKey(longString);
      expect(typeof result === "string" || result === null).toBe(true);
    });
  });

  describe("normalizeMovieSource edge cases", () => {
    it("handles movie with valid source", () => {
      const movie = { id: "1", source: "Netflix", title: "Test" };
      const result = normalizeMovieSource(movie);
      expect(result).toBeDefined();
      expect(result.title).toBe("Test");
    });

    it("handles null movie gracefully", () => {
      const result = normalizeMovieSource(null);
      expect(result).toBeDefined();
    });

    it("handles movie with undefined source", () => {
      const movie = { id: "1", source: undefined, title: "Test" };
      const result = normalizeMovieSource(movie);
      expect(result).toBeDefined();
    });

    it("handles movie with all fields", () => {
      const movie = {
        id: "1",
        title: "Test Movie",
        source: "Netflix",
        imdbRating: 8.5,
        releaseYear: 2024,
        genres: ["Action", "Drama"],
        isSeries: false,
        posterUrl: "https://example.com/poster.jpg",
        backdropUrl: "https://example.com/backdrop.jpg",
      };
      const result = normalizeMovieSource(movie);
      expect(result.title).toBe("Test Movie");
      expect(result.imdbRating).toBe(8.5);
    });

    it("handles movie with all null/undefined optional fields", () => {
      const movie = {
        id: "1",
        title: "Minimal",
        genres: null,
        tags: undefined,
        availablePlatforms: null,
        posterUrl: null,
        backdropUrl: undefined,
      };
      const result = normalizeMovieSource(movie);
      expect(result.title).toBe("Minimal");
    });

    it("handles movie with numeric id", () => {
      const movie = { id: 12345, title: "Test" };
      const result = normalizeMovieSource(movie);
      expect(result.id).toBeDefined();
    });

    it("handles movie with empty string id", () => {
      const movie = { id: "", title: "Test" };
      const result = normalizeMovieSource(movie);
      expect(result).toBeDefined();
    });
  });

  describe("PLATFORMS constants", () => {
    it("has at least 5 platforms defined", () => {
      expect(Object.keys(PLATFORMS).length).toBeGreaterThanOrEqual(5);
    });

    it("each platform has name, color, and category", () => {
      for (const [key, platform] of Object.entries(PLATFORMS)) {
        expect(platform.name).toBeDefined();
        expect(platform.color).toBeDefined();
        expect(platform.category).toBeDefined();
      }
    });

    it("netflix platform is correctly defined", () => {
      expect(PLATFORMS.netflix).toBeDefined();
      expect(PLATFORMS.netflix.name.toLowerCase()).toContain("netflix");
    });

    it("prime platform is correctly defined", () => {
      expect(PLATFORMS.prime).toBeDefined();
      expect(PLATFORMS.prime.name.toLowerCase()).toContain("prime");
    });
  });
});
