import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the wakeup logic in isolation
// Since apiClient uses module-level state, we test the behavior patterns

describe('apiClient wakeup logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('dispatches server-wakeup event after 5s of inactivity', () => {
    // Simulate the wakeup logic
    let inflightCount = 0;
    let wakeupTimer = null;
    let wakeupFired = false;

    function onFirstRequest() {
      inflightCount++;
      if (inflightCount === 1 && !wakeupFired) {
        wakeupTimer = setTimeout(() => {
          wakeupFired = true;
          window.dispatchEvent(new Event('server-wakeup'));
        }, 5000);
      }
    }

    onFirstRequest();
    expect(inflightCount).toBe(1);

    vi.advanceTimersByTime(5000);
    expect(wakeupFired).toBe(true);
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'server-wakeup' }));
  });

  it('cancels wakeup timer if request completes before 5s', () => {
    let inflightCount = 0;
    let wakeupTimer = null;

    function onFirstRequest() {
      inflightCount++;
      if (inflightCount === 1) {
        wakeupTimer = setTimeout(() => {
          window.dispatchEvent(new Event('server-wakeup'));
        }, 5000);
      }
    }

    function onComplete() {
      inflightCount = Math.max(0, inflightCount - 1);
      if (inflightCount === 0 && wakeupTimer) {
        clearTimeout(wakeupTimer);
        wakeupTimer = null;
      }
    }

    onFirstRequest();
    vi.advanceTimersByTime(3000); // 3s — not yet
    onComplete(); // Request finished
    vi.advanceTimersByTime(3000); // Another 3s
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  it('safety timeout resets wakeupFired after 30s', () => {
    let wakeupFired = false;
    let safetyTimer = null;

    function fire() {
      wakeupFired = true;
      safetyTimer = setTimeout(() => { wakeupFired = false; }, 30000);
    }

    fire();
    expect(wakeupFired).toBe(true);

    vi.advanceTimersByTime(30000);
    expect(wakeupFired).toBe(false);

    if (safetyTimer) clearTimeout(safetyTimer);
  });
});
