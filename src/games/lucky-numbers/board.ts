import type { ScreenContext } from "../../platform/ui/screen-context";
import {
  Cabinet,
  boardState,
  mainAction,
} from "../../platform/rendering/cabinet";
export function renderBoard(ctx: ScreenContext) {
  const { scene, theme, config } = ctx;
  const c = new Cabinet(ctx),
    r = boardState(ctx);
  c.frame(27, 158, 241, 420, "#370917ef", true);
  c.plate("YOUR PRIZE LADDER", 46, 174, 204, 32);
  const tiers = [
    ["1 MATCH", `${config?.matchPrize || 15} CREDITS`, r.progress >= 1],
    ["2 MATCHES", "MULTIPLIER BONUS", r.first],
    ["3 MATCHES", "OPEN THE VAULT", r.second],
  ] as const;
  tiers.forEach(([name, prize, on], i) => {
    scene.panel(
      44,
      224 + i * 101,
      207,
      85,
      on ? "#174c33" : "#651423",
      theme.presentation.trim,
      6,
    );
    scene.text(name, 148, 234 + i * 101, 17, "#ffe7a5", true);
    scene.text(prize, 148, 269 + i * 101, 15, on ? "#b5ffbe" : "#fff7d1", true);
  });
  scene.text("PRIZE POT", 148, 526, 12, theme.accent, true);
  scene.text(`${r.base} CREDITS`, 148, 544, 19, "#ffffff", true);
  c.frame(290, 154, 782, 427, "#600c1ae8", true);
  scene.text("WINNING NUMBERS", 681, 169, 17, "#ffe2a2", true);
  (config?.winningNumbers || [7, 14, 21]).forEach((number, i) => {
    c.frame(513 + i * 118, 199, 101, 62, "#ffedab");
    scene.text(
      String(number).padStart(2, "0"),
      563 + i * 118,
      209,
      32,
      "#321c15",
      true,
    );
  });
  scene.text("YOUR NUMBERS", 682, 267, 15, "#ffe5ad", true);
  const cols = theme.presentation.columns,
    rows = Math.ceil(r.tiles.length / cols),
    w = (726 - (cols - 1) * 14) / cols,
    h = (262 - (rows - 1) * 8) / rows,
    gap = 14;
  r.tiles.forEach((value, i) =>
    c.tile(
      i,
      311 + (i % cols) * (w + gap),
      298 + Math.floor(i / cols) * (h + 8),
      w,
      h,
      value,
      "number",
      ctx.preview,
    ),
  );
  scene.text(
    "MATCH ANY WINNING NUMBER TO WIN THE PRIZE SHOWN",
    682,
    590,
    12,
    "#fff3cd",
    true,
  );
  mainAction(ctx, 330, 612, 440);
}
