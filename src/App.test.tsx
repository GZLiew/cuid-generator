import { beforeAll, beforeEach, afterEach, describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { randomFillSync } from "crypto";

// Mock the clipboard-manager plugin
const mockWriteText = vi.fn().mockResolvedValue(undefined);
vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  writeText: (...args: unknown[]) => mockWriteText(...args),
}));

import App from "./App";

beforeAll(() => {
  Object.defineProperty(window, "crypto", {
    value: { getRandomValues: (buffer: Buffer) => randomFillSync(buffer) },
  });
});

beforeEach(() => {
  clearMocks();
  mockWriteText.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const FAKE_CUID = "clxxxxxxxxxxxxxxxxxxxxxxxx";

function setupMockIPC() {
  mockIPC((cmd) => {
    if (cmd === "generate_cuid") return FAKE_CUID;
  });
}

describe("GEN-01: Generate button produces a CUID2 and displays it", () => {
  test("clicking Generate calls invoke('generate_cuid') and displays the returned CUID2 string", async () => {
    setupMockIPC();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText(FAKE_CUID)).toBeInTheDocument();
    });
  });
});

describe("GEN-02: CUID2 displayed in monospace font", () => {
  test("the displayed CUID2 has a font-mono class", async () => {
    setupMockIPC();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      const cuidElement = screen.getByText(FAKE_CUID);
      // The element or its parent should have font-mono class
      const hasFontMono =
        cuidElement.classList.contains("font-mono") ||
        cuidElement.closest(".font-mono") !== null;
      expect(hasFontMono).toBe(true);
    });
  });
});

describe("GEN-04: Auto-copy to clipboard on generation", () => {
  test("writeText() is called with the generated CUID immediately after invoke", async () => {
    setupMockIPC();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(FAKE_CUID);
    });
  });
});

describe("GEN-05: Visual confirmation with Copied! text", () => {
  test("after clicking Generate, button text changes to Copied! then reverts after 1500ms", async () => {
    setupMockIPC();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });

    // Advance timers past the 1500ms timeout
    vi.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generate/i })).toBeInTheDocument();
    });
  });
});

describe("GEN-03: Manual copy by clicking displayed CUID", () => {
  test("clicking the displayed CUID calls writeText with the current CUID", async () => {
    setupMockIPC();
    render(<App />);

    // First generate a CUID
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText(FAKE_CUID)).toBeInTheDocument();
    });

    // Clear mock to track the manual copy separately
    mockWriteText.mockClear();

    // Click the displayed CUID to copy
    fireEvent.click(screen.getByText(FAKE_CUID));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(FAKE_CUID);
    });
  });
});
