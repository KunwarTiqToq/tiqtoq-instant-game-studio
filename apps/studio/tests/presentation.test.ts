import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { themes } from "../src/games/registry";
describe("reference-inspired presentation assets", () => {
  it("uses three distinct cabinet layouts and locally bundled image assets", () => {
    expect(new Set(themes.map((theme) => theme.presentation.layout)).size).toBe(
      3,
    );
    for (const theme of themes) {
      const bytes = readFileSync(
        new URL("../public" + theme.presentation.backdrop, import.meta.url),
      );
      expect(bytes[0]).toBe(0xff);
      expect(bytes[1]).toBe(0xd8);
      expect(bytes.length).toBeLessThan(500000);
    }
  });
  it("bounds animation work and retains inspectable game labels", () => {
    for (const theme of themes) {
      expect(theme.presentation.animation.revealMs).toBeLessThanOrEqual(1000);
      expect(theme.presentation.animation.particles).toBeLessThanOrEqual(40);
      expect(theme.bonus1.length).toBeGreaterThan(0);
      expect(theme.bonus2.length).toBeGreaterThan(0);
    }
  });
});
