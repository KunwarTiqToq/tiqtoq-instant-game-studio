import type { ScreenContext } from "../../platform/ui/screen-context";
import { Cabinet, boardState } from "../../platform/rendering/cabinet";
export function renderBoard(ctx: ScreenContext) {
  const { scene, theme, textures, config } = ctx;
  const c = new Cabinet(ctx),
    r = boardState(ctx);
  c.frame(25, 153, 252, 434, "#090c2bea");
  scene.text("STAR POWER", 151, 172, 22, theme.accent, true);
  const labels = ["STAR PRIZE", "EXTRA PICKS", "CONSTELLATION"];
  [4, 5, 9].forEach((symbol, i) => {
    const x = 45 + i * 76;
    scene.image(textures[symbol], x + 30, 232, 47, ctx.symbols[symbol]);
    scene.text(
      i === 0 ? `${config?.matchPrize || 5}` : i === 1 ? "3" : "6",
      x + 30,
      264,
      20,
      "#ffffff",
      true,
    );
    for (let k = 0; k < 6; k++) {
      const lit = r.progress >= 6 - k;
      scene.panel(
        x,
        304 + k * 37,
        60,
        29,
        lit
          ? i === 0
            ? "#e834e5"
            : i === 1
              ? "#04cddd"
              : "#8058ff"
          : "#101531",
        i === 0 ? "#fa50ef" : i === 1 ? "#47edff" : "#ad8aff",
        3,
      );
    }
    scene.text(labels[i], x + 30, 541, 9, "#d5e7ff", true);
  });
  c.frame(292, 153, 198, 434, "#120a35eb");
  c.plate("BONUS PORTAL", 307, 167, 169, 30);
  scene.text("EXTRA CHANCES", 391, 214, 13, "#f8beff", true);
  c.pips(354, 254, Math.min(r.progress, 3), 3, 9);
  scene.text(
    r.first ? "READY TO PLAY" : "COLLECT 3 STARS",
    391,
    280,
    12,
    r.first ? "#b4ffed" : "#b9b4dc",
    true,
  );
  scene.text("CONSTELLATION", 391, 319, 13, "#9cffff", true);
  scene.text(
    `${Math.min(r.progress, 6)} / 6 STARS`,
    391,
    348,
    20,
    theme.accent,
    true,
  );
  const left = r.tiles.filter((v) => v === null).length;
  if (!ctx.preview)
    c.go(
      391,
      454,
      left ? "GO" : r.first || r.second ? "BONUS" : "WIN",
      left
        ? `${left} CHANCES LEFT`
        : r.first || r.second
          ? "ENTER YOUR BONUS"
          : "SEE YOUR RESULT",
      ctx.continueAction(left ? "reveal-all" : "continue"),
      !ctx.busy,
    );
  else c.go(391, 454, "GO", "YOUR NEXT ADVENTURE", () => {}, false);
  c.frame(508, 153, 565, 434, "#080c29ec");
  scene.text("YOUR GALAXY", 790, 166, 17, "#b8f9ff", true);
  const cols = theme.presentation.columns,
    rows = Math.ceil(r.tiles.length / cols),
    w = (515 - (cols - 1) * 13) / cols,
    h = (364 - (rows - 1) * 12) / rows,
    gap = 13;
  r.tiles.forEach((value, i) =>
    c.tile(
      i,
      536 + (i % cols) * (w + gap),
      199 + Math.floor(i / cols) * (h + 12),
      w,
      h,
      value,
      "symbol",
      ctx.preview,
    ),
  );
  for (let i = 0; i < cols; i++)
    scene.text(
      String(i + 1),
      536 + w / 2 + i * (w + gap),
      579,
      10,
      "#b4dcff",
      true,
    );
  scene.text(
    "Every Star wins credits. Collect three for extra picks — six for the constellation.",
    550,
    612,
    17,
    "#d6e7ff",
    true,
  );
}
