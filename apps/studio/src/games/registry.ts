import treasure from "./treasure-chances/theme.json";
import numbers from "./lucky-numbers/theme.json";
import stars from "./star-quest/theme.json";
import type { GameId } from "../platform/network/client";
import type { SoundTheme } from "../platform/audio/audio";
export interface Theme {
  id: GameId;
  name: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  accent: string;
  background: string;
  panel: string;
  tile: string;
  titleFont: string;
  bonus1: string;
  bonus2: string;
  sound: SoundTheme;
  presentation: {
    layout: "treasure-board" | "number-stage" | "neon-grid";
    columns: number;
    trim: string;
    backdrop: string;
    animation: {
      revealMs: number;
      bonusMs: number;
      wheelMs: number;
      particles: number;
    };
  };
}
export const themes = [treasure, numbers, stars] as Theme[];
for (const theme of themes) {
  if (
    ![theme.accent, theme.background, theme.panel, theme.tile].every((value) =>
      /^#[0-9a-f]{6}$/i.test(value),
    ) ||
    !["sine", "triangle", "square", "sawtooth"].includes(theme.sound.wave) ||
    theme.sound.volume < 0 ||
    theme.sound.volume > 1 ||
    theme.sound.root < 50 ||
    theme.sound.root > 2000 ||
    theme.sound.musicTempo < 30 ||
    theme.sound.musicTempo > 200 ||
    !["treasure-board", "number-stage", "neon-grid"].includes(
      theme.presentation.layout,
    ) ||
    !Number.isInteger(theme.presentation.columns) ||
    theme.presentation.columns < 3 ||
    theme.presentation.columns > 4 ||
    !/^#[0-9a-f]{6}$/i.test(theme.presentation.trim) ||
    !theme.presentation.backdrop.startsWith(`/games/${theme.id}/`) ||
    ![
      theme.presentation.animation.revealMs,
      theme.presentation.animation.bonusMs,
      theme.presentation.animation.wheelMs,
    ].every((n) => Number.isInteger(n) && n >= 0 && n <= 5000) ||
    !Number.isInteger(theme.presentation.animation.particles) ||
    theme.presentation.animation.particles < 0 ||
    theme.presentation.animation.particles > 40
  )
    throw new Error(`Invalid theme: ${theme.id}`);
}
export const themeFor = (id: string) => themes.find((theme) => theme.id === id);
