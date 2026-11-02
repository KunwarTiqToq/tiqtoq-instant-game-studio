import type { GameConfig } from "../../platform/network/client";
export function content(config: GameConfig) {
  return {
    intro: `Reveal ${config.tileCount} chances. Every Star pays ${config.matchPrize} credits.\nCollect three for extra picks; six for Constellation.`,
    instructions: `Every revealed Star pays ${config.matchPrize} credits.\nThree Stars unlock three extra picks. Six unlock Constellation.\nCollect all three extra picks, then choose a constellation.`,
    prizes: `Extra picks: ${Math.min(...config.bonus1)}–${Math.max(...config.bonus1)} each · Constellation: ${Math.min(...config.bonus2)}–${Math.max(...config.bonus2)} credits`,
  };
}
