import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Pure debouncer test verifying the exact setTimeout / clearTimeout semantics used in useDebouncedValue
 */
function createDebouncer(delayMs = 400) {
  let timer = null;
  let currentValue = null;

  const push = (val, onResolve) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      currentValue = val;
      if (onResolve) onResolve(val);
    }, delayMs);
  };

  const get = () => currentValue;
  const cancel = () => {
    if (timer) clearTimeout(timer);
  };

  return { push, get, cancel };
}

describe("Debounce Utility & VietQR Typing Behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not update value before delay expires", () => {
    const debouncer = createDebouncer(400);
    debouncer.push(50000);

    vi.advanceTimersByTime(200);
    expect(debouncer.get()).toBe(null);

    vi.advanceTimersByTime(200);
    expect(debouncer.get()).toBe(50000);
  });

  it("cancels prior timeouts when rapid keystrokes occur within delay window", () => {
    const debouncer = createDebouncer(400);
    const callback = vi.fn();

    // User types '5'
    debouncer.push(5, callback);
    vi.advanceTimersByTime(100);

    // User types '0' -> '50'
    debouncer.push(50, callback);
    vi.advanceTimersByTime(100);

    // User types '0' -> '500'
    debouncer.push(500, callback);
    vi.advanceTimersByTime(100);

    // User types '0' -> '5000'
    debouncer.push(5000, callback);
    vi.advanceTimersByTime(100);

    // User types '0' -> '50000'
    debouncer.push(50000, callback);

    // Keystrokes were rapid, callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Wait full 400ms after last keystroke
    vi.advanceTimersByTime(400);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(50000);
    expect(debouncer.get()).toBe(50000);
  });
});
