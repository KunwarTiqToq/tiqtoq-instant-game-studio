import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultMiniConfig,
  drawMini,
  validateMiniConfig,
} from "../src/games/mini/mini-engine.js";

test("wheel supports each sector and computes instant versus multiplier prizes", () => {
  const config = {
    mode: "instant" as const,
    prizes: [{ amount: 0 }, { amount: 25 }, { amount: 50 }],
  };
  for (let i = 0; i < 3; i++)
    assert.equal(
      drawMini("wheel", config, undefined, () => i).payout,
      config.prizes[i].amount,
    );
  const multiplied = drawMini(
    "wheel",
    { ...config, mode: "multiplier", baseAmount: 10 },
    undefined,
    () => 1,
  );
  assert.equal(multiplied.payout, 250);
  assert.equal(multiplied.prizeIndex, 1);
});
test("chest counts and base amounts are validated before play", () => {
  assert.throws(() =>
    validateMiniConfig("wheel", {
      mode: "multiplier",
      prizes: [{ amount: 1 }, { amount: 2 }],
    }),
  );
  assert.throws(() =>
    validateMiniConfig("chests", {
      mode: "instant",
      prizes: Array.from({ length: 13 }, () => ({ amount: 1 })),
    }),
  );
  assert.throws(() => drawMini("chests", defaultMiniConfig("chests"), 6));
  assert.throws(() => drawMini("chests", defaultMiniConfig("chests")));
  assert.throws(() =>
    validateMiniConfig("wheel", {
      mode: "multiplier",
      baseAmount: 10000,
      prizes: [{ amount: 1000000 }, { amount: 1 }],
    }),
  );
  assert.equal(
    drawMini("chests", defaultMiniConfig("chests"), 2, (bound) =>
      Math.min(5, bound - 1),
    ).payout,
    100,
  );
});

test("chest and scratch layouts contain every configured prize exactly once and match the paid choice", () => {
  for (const type of ["chests", "scratch"] as const) {
    const config = defaultMiniConfig(type);
    for (let choice = 0; choice < config.prizes.length; choice++) {
      const result = drawMini(type, config, choice);
      assert.deepEqual(
        [...result.revealedPrizes!].sort((a, b) => a - b),
        [0, 1, 2, 3, 4, 5],
      );
      assert.equal(result.revealedPrizes![choice], result.prizeIndex);
      assert.equal(result.amount, config.prizes[result.prizeIndex].amount);
    }
  }
});
test("bird reward range includes both boundaries, multiplies exactly, and rejects invalid settings", () => {
  const config = {
    ...defaultMiniConfig("targets"),
    mode: "multiplier" as const,
    baseAmount: 10,
    targetRange: { min: 2, max: 7 },
  };
  assert.equal(drawMini("targets", config, 0, () => 0).payout, 20);
  assert.equal(drawMini("targets", config, 0, (bound) => bound - 1).payout, 70);
  assert.throws(() => drawMini("targets", config));
  assert.throws(() =>
    validateMiniConfig("targets", {
      ...config,
      targetRange: { min: 8, max: 7 },
    }),
  );
  assert.throws(() =>
    validateMiniConfig("targets", {
      ...config,
      targetRange: { min: 0, max: 100001 },
    }),
  );
});
test("mixed scratch zones use the selected prize mode and require a base for multiplier zones", () => {
  const config = {
    mode: "instant" as const,
    baseAmount: 10,
    prizes: [
      { mode: "instant" as const, amount: 25 },
      { mode: "multiplier" as const, amount: 3 },
    ],
  };
  assert.equal(drawMini("scratch", config, 0, () => 0).payout, 25);
  const multiplier = drawMini("scratch", config, 0, () => 1);
  assert.equal(multiplier.payout, 30);
  assert.equal(multiplier.mode, "multiplier");
  assert.throws(() =>
    validateMiniConfig("scratch", { ...config, baseAmount: undefined }),
  );
});
