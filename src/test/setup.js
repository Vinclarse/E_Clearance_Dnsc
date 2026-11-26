import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearReadCache } from "../services/api.js";

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
}
if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = vi.fn();
}
if (!window.crypto?.randomUUID) {
  Object.defineProperty(window, "crypto", {
    value: { randomUUID: () => `uuid-${Math.random().toString(36).slice(2, 10)}` },
  });
}

afterEach(() => {
  cleanup();
  clearReadCache();
  localStorage.clear();
  vi.restoreAllMocks();
});
