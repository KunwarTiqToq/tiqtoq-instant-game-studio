export function layout(scenario) {
  return {
    "double-bonus": [3, 3, 3, 4, 4, 4, 7, 7, 7],
    "first-bonus": [3, 3, 3, 7, 7, 7, 0, 1, 2],
    win: [7, 7, 7, 0, 1, 2, 5, 6, 8],
    lose: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  }[scenario];
}
export function evaluate(revealed, config) {
  const count = (value) => revealed.filter((x) => x === value).length;
  return {
    base: count(7) >= 3 ? config.matchPrize : 0,
    first: count(3) >= 3,
    second: count(4) >= 3,
    progress: count(3),
    secondary: count(4),
  };
}
