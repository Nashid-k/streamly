import { describe, it, expect } from "vitest";
import { VideoSourceAdapter } from "../api/videoSourceAdapter";

describe("videoSourceAdapter edge cases", () => {
  describe("VideoSourceAdapter.getStreamUrl", () => {
    it("returns a URL string for valid inputs", () => {
      const url = VideoSourceAdapter.getStreamUrl(0, "12345");
      expect(typeof url).toBe("string");
      expect(url).toContain("12345");
    });

    it("handles season and episode parameters", () => {
      const url = VideoSourceAdapter.getStreamUrl(0, "12345", 2, 3);
      expect(url).toContain("12345");
    });

    it("handles server index 0", () => {
      const url = VideoSourceAdapter.getStreamUrl(0, "12345");
      expect(url).toBeDefined();
    });

    it("handles server index out of bounds (falls back to first)", () => {
      const url = VideoSourceAdapter.getStreamUrl(99, "12345");
      expect(typeof url).toBe("string");
    });

    it("handles negative server index", () => {
      const url = VideoSourceAdapter.getStreamUrl(-1, "12345");
      expect(typeof url).toBe("string");
    });

    it("handles IMDb ID parameter", () => {
      const url = VideoSourceAdapter.getStreamUrl(1, "12345", 1, 1, "tt1234567");
      expect(url).toContain("tt1234567");
    });

    it("different servers produce different URLs", () => {
      const url0 = VideoSourceAdapter.getStreamUrl(0, "12345");
      const url1 = VideoSourceAdapter.getStreamUrl(1, "12345");
      // They should be different server URLs
      expect(url0).not.toBe(url1);
    });

    it("handles movie without season (no season param)", () => {
      const url = VideoSourceAdapter.getStreamUrl(0, "12345");
      expect(typeof url).toBe("string");
    });
  });

  describe("VideoSourceAdapter.getServers", () => {
    it("returns array of servers", () => {
      const servers = VideoSourceAdapter.getServers();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
    });

    it("each server has name and url", () => {
      const servers = VideoSourceAdapter.getServers();
      servers.forEach(server => {
        expect(server.name).toBeDefined();
        expect(typeof server.url).toBe("function");
      });
    });

    it("has at least 3 servers", () => {
      const servers = VideoSourceAdapter.getServers();
      expect(servers.length).toBeGreaterThanOrEqual(3);
    });

    it("each server URL function returns a string", () => {
      const servers = VideoSourceAdapter.getServers();
      servers.forEach(server => {
        const url = server.url("12345", undefined, undefined);
        expect(typeof url).toBe("string");
      });
    });

    it("each server URL function handles TV shows", () => {
      const servers = VideoSourceAdapter.getServers();
      servers.forEach(server => {
        const url = server.url("12345", 2, 3);
        expect(typeof url).toBe("string");
      });
    });
  });
});
