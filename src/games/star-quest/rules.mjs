export function layout(scenario, config) {
  const base = {
    "double-bonus": [4, 4, 4, 4, 4, 4, 9, 9, 9],
    "first-bonus": [4, 4, 4, 9, 9, 9, 5, 5, 5],
    win: [4, 4, 9, 9, 9, 5, 5, 5, 5],
    lose: [9, 9, 9, 9, 9, 5, 5, 5, 5],
  }[scenario];
  return [
    ...base,
    ...Array.from({ length: config.tileCount - base.length }, (_, i) =>
      i % 2 ? 5 : 9,
    ),
  ];
}
export function evaluate(revealed, config) {
  const stars = revealed.filter((n) => n === 4).length;
  return {
    base: stars * config.matchPrize,
    first: stars >= 3,
    second: stars >= 6,
    progress: stars,
    secondary: stars,
  };
}
