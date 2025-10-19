import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv("PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
vi.stubEnv("PUBLIC_SUPABASE_KEY", "test-anon-key");

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    // Mock constructor
  }
  disconnect() {
    // Mock method
  }
  observe() {
    // Mock method
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    // Mock method
  }
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {
    // Mock constructor
  }
  disconnect() {
    // Mock method
  }
  observe() {
    // Mock method
  }
  unobserve() {
    // Mock method
  }
} as unknown as typeof ResizeObserver;

// Extend expect with custom matchers if needed
expect.extend({
  // Add custom matchers here if needed
});
