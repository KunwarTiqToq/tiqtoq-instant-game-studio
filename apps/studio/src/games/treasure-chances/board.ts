import type { ScreenContext } from "../../platform/ui/screen-context";
import {
  Cabinet,
  boardState,
  mainAction,
} from "../../platform/rendering/cabinet";
export function renderBoard(ctx: ScreenContext) {
  const { scene, theme, textures, config } = ctx;
  const c = new Cabinet(ctx),
    r = boardState(ctx);
  c.frame(28, 154, 211, 422, "#081d2de8");
  c.plate("PRIZE GAME", 43, 170, 181);
  scene.image(textures[7], 132, 246, 100, "Crown");
  c.title(String(config?.matchPrize || 50), 132, 303, 48, true);
  scene.text("CREDITS", 132, 358, 17, theme.accent, true);
  scene.text("MATCH 3 CROWNS", 132, 396, 17, "#fff2c9", true);
  c.pips(92, 444, r.tiles.filter((v) => v === 7).length, 3, 10);
  scene.text(
    "Uncover three royal\nsymbols to win.",
    132,
    487,
    17,
    "#ccdbe4",
    true,
  );
  c.frame(254, 154, 591, 422, "#072b37ec");
  c.plate("YOUR TREASURE CHANCES", 273, 164, 553, 30);
  const columns = theme.presentation.columns,
    rows = Math.ceil(r.tiles.length / columns),
    w = (542 - (columns - 1) * 13) / columns,
    h = (359 - (rows - 1) * 13) / rows,
    gap = 13;
  r.tiles.forEach((value, i) =>
    c.tile(
      i,
      282 + (i % columns) * (w + gap),
      207 + Math.floor(i / columns) * (h + gap),
      w,
      h,
      value,
      "symbol",
      ctx.preview,
    ),
  );
  c.frame(860, 154, 212, 202, "#081d2de8");
  scene.text("CHEST BONUS", 966, 170, 18, theme.accent, true);
  scene.image(textures[3], 966, 232, 71, "Bell");
  c.pips(924, 293, Math.min(r.progress, 3), 3, 10);
  scene.text(
    r.first ? "UNLOCKED!" : "COLLECT 3 BELLS",
    966,
    322,
    14,
    r.first ? "#fff4b8" : "#d3e5e7",
    true,
  );
  c.frame(860, 372, 212, 204, "#081d2de8");
  scene.text("WHEEL BONUS", 966, 387, 18, theme.accent, true);
  scene.image(textures[4], 966, 449, 75, "Star");
  c.pips(924, 509, Math.min(r.secondary, 3), 3, 10);
  scene.text(
    r.second ? "UNLOCKED!" : "COLLECT 3 STARS",
    966,
    542,
    14,
    r.second ? "#fff4b8" : "#d3e5e7",
    true,
  );
  scene.text(
    "Reveal the symbols. Fill your collectors. Unlock two bonus adventures.",
    550,
    584,
    16,
    "#fff0ca",
    true,
  );
  mainAction(ctx, 330, 612, 440);
}
