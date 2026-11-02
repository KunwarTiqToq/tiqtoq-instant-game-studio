import type { GameConfig } from "../../platform/network/client";
export function content(config: GameConfig) {
  return {
    intro: `Reveal ${config.tileCount} numbers. Each winning match pays ${config.matchPrize} credits.\nTwo matches unlock a multiplier. Three unlock the vault.`,
    instructions: `Match your numbers against ${config.winningNumbers!.join(", ")}. Each pays ${config.matchPrize}.\nTwo matches unlock a multiplier card; three unlock a vault.\nThe multiplier increases your main-game prize.`,
    prizes: `Multiplier: ${Math.min(...config.bonus1)}×–${Math.max(...config.bonus1)}× · Vaults: ${Math.min(...config.bonus2)}–${Math.max(...config.bonus2)} credits`,
  };
}
