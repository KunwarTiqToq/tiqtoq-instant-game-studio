import { Graphics } from "pixi.js";
import type { ScreenContext } from "../screen-context";
import { renderReveal } from "./revealScreen";
import { Cabinet } from "../../rendering/cabinet";
export function renderIntro(ctx: ScreenContext) {
  const {
    scene,
    theme,
    layer,
    config,
    client,
    copy,
    request,
    button,
  } = ctx;
  renderReveal({ ...ctx, preview: true });
  const scrim = new Graphics()
    .roundRect(20, 145, 1060, 510, 12)
    .fill({ color: "#080916", alpha: 0.62 });
  scrim.eventMode = "static";
  layer.addChild(scrim);
  scene.actions = scene.actions.filter(
    (a) =>
      a.label === "SOUND ON" || a.label === "SOUND OFF" || a.label === "ⓘ INFO",
  );
  const c = new Cabinet(ctx);
  c.frame(230, 237, 640, 317, theme.panel, true);
  c.title("YOUR ADVENTURE STARTS HERE", 550, 262, 27, true);
  scene.text(copy.intro, 550, 322, 19, "#fff2d8", true);
  button(
    `PLAY · ${config?.cost ?? 10} CREDITS`,
    330,
    437,
    440,
    () => void request("round.start", ctx.startPayload(), "click"),
    (client.state?.player.balance || 0) >= (config?.cost ?? 10),
    62,
  );
  scene.text(
    "CLICK TO REVEAL · TWO BONUS ADVENTURES",
    550,
    520,
    12,
    theme.accent,
    true,
  );
}
