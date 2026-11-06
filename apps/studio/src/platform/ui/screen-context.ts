import type { Container, Texture } from "pixi.js";
import type { Theme } from "../../games/registry";
import type { GameClient, GameConfig, Round } from "../network/client";
import type { Scene } from "../rendering/scene";
import type { GameAudio, Cue } from "../audio/audio";
import type { Fault } from "../faults";
export interface ScreenContext {
  /** Deliberate defects requested by `?fault=`; empty in normal play. */
  faults: Set<Fault>;
  /** The `round.start` payload for the next round. */
  startPayload: () => Record<string, unknown>;
  theme: Theme;
  config: GameConfig | undefined;
  client: GameClient;
  scene: Scene;
  layer: Container;
  textures: Texture[];
  select: HTMLSelectElement;
  seedInput: HTMLInputElement;
  busy: boolean;
  wheelAnimating: boolean;
  revealIndices: number[];
  preview?: boolean;
  audio: GameAudio;
  symbols: string[];
  copy: { intro: string; instructions: string; prizes: string };
  currentRound: () => Round | null;
  action: (name: string, index?: number, cue?: Cue) => void;
  request: (type: string, payload?: unknown, cue?: Cue) => Promise<void>;
  button: (
    label: string,
    x: number,
    y: number,
    w: number,
    run: () => void,
    enabled?: boolean,
    h?: number,
    secondary?: boolean,
  ) => Container;
  continueAction: (name: string) => () => void;
  render: () => void;
  setInfo: (value: boolean) => void;
  setMessage: (value: string) => void;
}
