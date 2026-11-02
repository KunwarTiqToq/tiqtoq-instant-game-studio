import { content as treasure } from "./treasure-chances/content";
import { content as numbers } from "./lucky-numbers/content";
import { content as stars } from "./star-quest/content";
import type { GameId, GameConfig } from "../platform/network/client";
const definitions = {
  "treasure-chances": treasure,
  "lucky-numbers": numbers,
  "star-quest": stars,
};
export const contentFor = (id: GameId, config: GameConfig) =>
  definitions[id](config);
