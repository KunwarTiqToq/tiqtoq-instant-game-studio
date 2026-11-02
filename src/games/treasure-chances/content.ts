import type { GameConfig } from "../../platform/network/client";
export function content(config: GameConfig) {
  return {
    intro: `Nine chances. Match three Crowns for ${config.matchPrize} credits.\nThree Bells unlock Chests. Three Stars unlock the Wheel.`,
    instructions: `Reveal all nine chances. Three Crowns pay ${config.matchPrize} credits.\nThree Bells unlock the Chests. Three Stars unlock the Wheel.\nChoose one chest, then spin the wheel if unlocked.`,
    prizes: `Chests: ${Math.min(...config.bonus1)}–${Math.max(...config.bonus1)} · Wheel: ${Math.min(...config.bonus2)}–${Math.max(...config.bonus2)} credits`,
  };
}
