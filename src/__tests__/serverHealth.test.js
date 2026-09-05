import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startServerHealthMonitor,
  resetServerHealthState,
  getServerHealth,
  apiHealthUrl,
  streamHealthUrl,
  probeHealth,
} from "../api/serverHealth";

const isApiUrl = (url) => !String(url).includes("/api/health");

const expectedCallsPerCycle = () => (streamHealthUrl() ? 2 : 1);

function makeFetch(impl) {
  const mock = vi.fn((url, init) => impl(url, init));
  vi.stubGlobal("fetch", mock);
  return mock;
}

describe("serverHealth monitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetServerHealthState();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("probes once on boot, reports healthy, and then idles (no polling spam)", async () => {
    const fetchMock = makeFetch(() => Promise.resolve(new Response(null, { status: 200 })));
    const changes = [];
    startServerHealthMonitor({ onChange: (s) => changes.push(s) });

    await vi.advanceTimersByTimeAsync(1300); // initial delay

    expect(fetchMock).toHaveBeenCalledTimes(expectedCallsPerCycle());
    expect(getServerHealth().api.status).toBe("healthy");
    expect(changes.length).toBe(1);
    expect(changes[0].allHealthy).toBe(true);

    // A healthy backend must not be polled into staying awake
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchMock).toHaveBeenCalledTimes(expectedCallsPerCycle());
  });

  it("retries with backoff while down and stops once healthy", async () => {
    let apiAttempts = 0;
    const fetchMock = makeFetch((url) => {
      if (isApiUrl(url)) {
        apiAttempts += 1;
        if (apiAttempts === 1) return Promise.reject(new TypeError("network down"));
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      // stream service always healthy
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    const changes = [];
    startServerHealthMonitor({ onChange: (s) => changes.push(s) });

    await vi.advanceTimersByTimeAsync(1300); // boot probe fails for API
    expect(getServerHealth().api.status).toBe("down");
    expect(changes[changes.length - 1].allHealthy).toBe(false);

    await vi.advanceTimersByTimeAsync(4100); // first backoff (4s) retries → healthy
    expect(getServerHealth().api.status).toBe("healthy");
    expect(changes[changes.length - 1].allHealthy).toBe(true);
    expect(apiAttempts).toBe(2);

    // Healthy again → no more polling
    const callsAfter = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchMock.mock.calls.length).toBe(callsAfter);
  });

  it("derives a root /health URL (never /api/health) for the API", () => {
    const url = apiHealthUrl();
    expect(url.endsWith("/health")).toBe(true);
    expect(url.includes("/api/health")).toBe(false);
    const stream = streamHealthUrl();
    expect(stream === null || stream.endsWith("/api/health")).toBe(true);
  });

  it("probeHealth classifies a rejected request as a fast network failure", async () => {
    makeFetch(() => Promise.reject(new TypeError("boom")));
    const result = await probeHealth("http://localhost/health", 1000);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("network");
  });
});
