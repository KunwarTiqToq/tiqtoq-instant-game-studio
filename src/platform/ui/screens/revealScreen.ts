import type { ScreenContext } from "../screen-context";
import { renderBoard as treasure } from "../../../games/treasure-chances/board";
import { renderBoard as numbers } from "../../../games/lucky-numbers/board";
import { renderBoard as stars } from "../../../games/star-quest/board";
const boards = {
  "treasure-chances": treasure,
  "lucky-numbers": numbers,
  "star-quest": stars,
};
export function renderReveal(ctx: ScreenContext) {
  boards[ctx.theme.id](ctx);
}
