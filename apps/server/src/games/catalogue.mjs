import { readFileSync } from "node:fs";

export const GAME_IDS = ["treasure-chances", "lucky-numbers", "star-quest"];
export const SCENARIOS = [
  "random",
  "double-bonus",
  "first-bonus",
  "win",
  "lose",
];
export const games = Object.fromEntries(
  GAME_IDS.map((id) => {
    const config = JSON.parse(
      readFileSync(new URL(`./${id}/config.json`, import.meta.url)),
    );
    if (
      config.id !== id ||
      !Number.isInteger(config.cost) ||
      config.cost < 1 ||
      config.cost > 1000 ||
      !Number.isInteger(config.tileCount) ||
      config.tileCount < 9 ||
      config.tileCount >
        { "treasure-chances": 9, "lucky-numbers": 12, "star-quest": 16 }[id] ||
      !Number.isInteger(config.matchPrize) ||
      config.matchPrize < 1 ||
      config.matchPrize > 1000 ||
      !Array.isArray(config.bonus1) ||
      !Array.isArray(config.bonus2) ||
      !config.bonus1.every((n) => Number.isInteger(n) && n > 0 && n <= 1000) ||
      !config.bonus2.every((n) => Number.isInteger(n) && n > 0 && n <= 1000) ||
      config.bonus1.length !== 5 ||
      config.bonus2.length !== 6
    )
      throw new Error(`Invalid game configuration: ${id}`);
    if (
      id === "lucky-numbers" &&
      (!Array.isArray(config.winningNumbers) ||
        config.winningNumbers.length !== 3 ||
        new Set(config.winningNumbers).size !== 3 ||
        !config.winningNumbers.every(
          (n) => Number.isInteger(n) && n >= 1 && n <= 99,
        ))
    )
      throw new Error(
        "Lucky Numbers requires three distinct winning numbers from 1 to 99.",
      );
    return [id, config];
  }),
);
export function randomFromSeed(seed) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
