import { Graphics } from "pixi.js";
import type { ScreenContext } from "../screen-context";
import { Cabinet } from "../../rendering/cabinet";
export function renderInformation(ctx: ScreenContext) {
  const { theme, config, scene, layer, busy, audio, copy, render } = ctx,
    c = new Cabinet(ctx);
  const scrim = new Graphics()
    .rect(15, 140, 1070, 527)
    .fill({ color: "#040715", alpha: 0.9 });
  scrim.eventMode = "static";
  scrim.label = "Information overlay";
  layer.addChild(scrim);
  scene.actions = [];
  c.frame(165, 155, 770, 484, theme.panel, true);
  c.title("HOW TO PLAY", 550, 178, 31, true);
  scene.text(copy.instructions, 550, 244, 18, "#fff3e0", true);
  scene.text(`BONUS PRIZES\n${copy.prizes}`, 550, 352, 17, theme.accent, true);
  scene.text(
    `${config?.cost} pretend credits per round. No real money or prizes.\nWinnings are collected once on the result screen.\nReduced motion follows your device setting.`,
    550,
    433,
    16,
    "#e7dfe8",
    true,
  );
  scene.button(
    audio.muted ? "SOUND OFF" : "SOUND ON",
    230,
    550,
    195,
    () =>
      void audio
        .toggle()
        .then(render)
        .catch(() => {
          ctx.setMessage("Sound unavailable.");
          ctx.setInfo(false);
          render();
        }),
    !busy,
    46,
    true,
  );
  scene.button(
    audio.music ? "MUSIC ON" : "MUSIC OFF",
    450,
    550,
    195,
    () => {
      audio.toggleMusic();
      render();
    },
    !busy,
    46,
    true,
  );
  scene.button(
    "CLOSE INFO",
    670,
    550,
    195,
    () => {
      if (!ctx.faults.has("info-wont-close")) ctx.setInfo(false);
      render();
    },
    !busy,
    46,
  );
}
