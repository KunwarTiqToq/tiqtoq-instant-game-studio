export function layout(scenario, config) {
  const [first, second, third] = config.winningNumbers;
  const misses = Array.from({ length: 99 }, (_, i) => i + 1).filter(
    (n) => !config.winningNumbers.includes(n),
  );
  return {
    "double-bonus": [
      first,
      second,
      third,
      ...misses.slice(0, config.tileCount - 3),
    ],
    "first-bonus": [first, second, ...misses.slice(0, config.tileCount - 2)],
    win: [first, ...misses.slice(0, config.tileCount - 1)],
    lose: misses.slice(0, config.tileCount),
  }[scenario];
}
export function evaluate(revealed, config) {
  const matches = revealed.filter((n) =>
    config.winningNumbers.includes(n),
  ).length;
  return {
    base: matches * config.matchPrize,
    first: matches >= 2,
    second: matches >= 3,
    progress: matches,
    secondary: matches,
  };
}
