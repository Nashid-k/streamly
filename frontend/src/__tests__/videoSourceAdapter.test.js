import { describe, it, expect } from 'vitest';
import { VideoSourceAdapter } from '../api/videoSourceAdapter';

describe('VideoSourceAdapter', () => {
  describe('getServers', () => {
    it('returns an array of servers', () => {
      const servers = VideoSourceAdapter.getServers();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
    });

    it('each server has name and url function', () => {
      const servers = VideoSourceAdapter.getServers();
      servers.forEach(s => {
        expect(typeof s.name).toBe('string');
        expect(typeof s.url).toBe('function');
      });
    });
  });

  describe('getStreamUrl', () => {
    it('generates URL for CineSrc server (index 0) - movie', () => {
      const url = VideoSourceAdapter.getStreamUrl(0, '12345', null, null, null);
      expect(url).toContain('cinesrc.st');
      expect(url).toContain('movie/12345');
      expect(url).not.toContain('season');
    });

    it('generates URL for CineSrc server - TV show', () => {
      const url = VideoSourceAdapter.getStreamUrl(0, '12345', 2, 3, null);
      expect(url).toContain('cinesrc.st');
      expect(url).toContain('tv/12345');
      expect(url).toContain('s=2');
      expect(url).toContain('e=3');
    });

    it('generates URL for VidLink server (index 1) with IMDB', () => {
      const url = VideoSourceAdapter.getStreamUrl(1, '12345', 1, 5, 'tt1234567');
      expect(url).toContain('vidlink.pro');
      expect(url).toContain('tt1234567');
    });

    it('generates URL for VidLink server without IMDB', () => {
      const url = VideoSourceAdapter.getStreamUrl(1, '12345', null, null, null);
      expect(url).toContain('vidlink.pro');
      expect(url).toContain('movie/12345');
    });

    it('generates URL for 2Embed server (index 2)', () => {
      const url = VideoSourceAdapter.getStreamUrl(2, '12345', 1, 2, 'tt999');
      expect(url).toContain('2embed.cc');
      expect(url).toContain('tt999');
    });

    it('generates URL for VidSrcMe server (index 3)', () => {
      const url = VideoSourceAdapter.getStreamUrl(3, '12345', 1, 2, 'tt999');
      expect(url).toContain('vidsrcme.ru');
      expect(url).toContain('imdb=tt999');
    });

    it('falls back to index 0 for out-of-range index', () => {
      const url = VideoSourceAdapter.getStreamUrl(99, '12345', null, null, null);
      expect(url).toContain('cinesrc.st');
    });

    it('falls back to index 0 for negative index', () => {
      const url = VideoSourceAdapter.getStreamUrl(-1, '12345', null, null, null);
      expect(url).toContain('cinesrc.st');
    });
  });
});
