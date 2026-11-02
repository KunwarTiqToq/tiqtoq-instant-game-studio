import { describe, it, expect } from "vitest";
import { themes, themeFor } from "../src/games/registry";
describe("game catalogue", () => {
  it("has three unique, configured game identities and bounded sound levels", () => {
    expect(new Set(themes.map((t) => t.id)).size).toBe(3);
    for (const theme of themes) {
      expect(theme.name.length).toBeGreaterThan(5);
      expect(theme.sound.volume).toBeGreaterThan(0);
      expect(theme.sound.volume).toBeLessThanOrEqual(1);
      expect(themeFor(theme.id)).toBe(theme);
    }
    expect(themeFor("unknown")).toBeUndefined();
  });
});
