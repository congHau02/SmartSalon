import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard } from "../lib/utils";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

describe("Runtime Resilience - Safe Clipboard & Error Boundary", () => {
  const originalNavigator = globalThis.navigator;
  const originalDocument = globalThis.document;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("copyToClipboard", () => {
    it("returns false immediately for empty or null text without throwing", async () => {
      expect(await copyToClipboard("")).toBe(false);
      expect(await copyToClipboard(null)).toBe(false);
      expect(await copyToClipboard(undefined)).toBe(false);
    });

    it("uses navigator.clipboard.writeText when available and successful", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        clipboard: { writeText: writeTextMock },
      });

      const success = await copyToClipboard("TEST-CODE-123");
      expect(success).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("TEST-CODE-123");
    });

    it("falls back to document.execCommand when navigator.clipboard throws", async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error("Permission denied"));
      vi.stubGlobal("navigator", {
        clipboard: { writeText: writeTextMock },
      });

      // Mock DOM fallback
      const execCommandMock = vi.fn().mockReturnValue(true);
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();

      vi.stubGlobal("document", {
        createElement: () => ({
          style: {},
          setAttribute: vi.fn(),
          focus: vi.fn(),
          select: vi.fn(),
          value: "",
        }),
        body: {
          appendChild: appendChildMock,
          removeChild: removeChildMock,
        },
        execCommand: execCommandMock,
      });

      const success = await copyToClipboard("FALLBACK-TEXT");
      expect(success).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    it("returns false safely when both clipboard API and DOM execCommand fail", async () => {
      vi.stubGlobal("navigator", {});
      vi.stubGlobal("document", {
        createElement: () => {
          throw new Error("DOM write error");
        },
      });

      const success = await copyToClipboard("FAILING-TEXT");
      expect(success).toBe(false);
    });
  });

  describe("ErrorBoundary Runtime Resilience", () => {
    it("derives error state from caught exception", () => {
      const testError = new Error("Component render failure");
      const state = ErrorBoundary.getDerivedStateFromError(testError);
      expect(state).toEqual({
        hasError: true,
        error: testError,
      });
    });

    it("renders fallback UI with specified portal title when hasError is true", () => {
      const instance = new ErrorBoundary({ title: "Cổng POS Kiểm Tra" });
      instance.state = {
        hasError: true,
        error: new Error("Test Crash"),
        errorInfo: { componentStack: "at TestComponent" },
        remountKey: 0,
      };

      const tree = instance.render();
      expect(tree).toBeDefined();
      expect(tree.type).toBe("div");
      // Verify children contains the title card
      expect(JSON.stringify(tree)).toContain("Cổng POS Kiểm Tra");
      expect(JSON.stringify(tree)).toContain("Tải lại giao diện");
    });

    it("clears error state and calls onReset when handleReset is triggered", () => {
      const onResetMock = vi.fn();
      const instance = new ErrorBoundary({ onReset: onResetMock });
      instance.state = {
        hasError: true,
        error: new Error("Test Crash"),
        errorInfo: null,
        remountKey: 0,
      };

      instance.setState = vi.fn((updater) => {
        if (typeof updater === "function") {
          instance.state = { ...instance.state, ...updater(instance.state) };
        } else {
          instance.state = { ...instance.state, ...updater };
        }
      });

      instance.handleReset();
      expect(onResetMock).toHaveBeenCalledTimes(1);
      expect(instance.state.hasError).toBe(false);
      expect(instance.state.error).toBe(null);
      expect(instance.state.remountKey).toBe(1);
    });

    it("resets error state when resetKeys change in componentDidUpdate", () => {
      const instance = new ErrorBoundary({ resetKeys: ["/pos"] });
      instance.state = {
        hasError: true,
        error: new Error("Test Crash"),
        errorInfo: null,
        remountKey: 0,
      };

      instance.setState = vi.fn((updater) => {
        if (typeof updater === "function") {
          instance.state = { ...instance.state, ...updater(instance.state) };
        } else {
          instance.state = { ...instance.state, ...updater };
        }
      });

      // Update with new route path
      instance.props = { resetKeys: ["/admin/bookings"] };
      instance.componentDidUpdate({ resetKeys: ["/pos"] });

      expect(instance.state.hasError).toBe(false);
      expect(instance.state.error).toBe(null);
      expect(instance.state.remountKey).toBe(1);
    });
  });
});
