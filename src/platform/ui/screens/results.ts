import type { ScreenContext } from "../screen-context";
import { Cabinet } from "../../rendering/cabinet";
export function renderResults(ctx: ScreenContext) {
  const {
      theme,
      scene,
      config,
      client,
      currentRound,
      button,
      request,
      select,
      seedInput,
    } = ctx,
    r = currentRound()!,
    c = new Cabinet(ctx);
  c.frame(63, 156, 974, 427, theme.panel, true);
  scene.text("YOUR ADVENTURE IS COMPLETE", 550, 178, 14, theme.accent, true);
  c.title(
    r.total ? "WINNING MOMENTS" : "NEXT TIME, A NEW ADVENTURE",
    550,
    211,
    r.total ? 38 : 30,
    true,
  );
  c.title(`${r.total} CREDITS`, 550, 280, 69, true);
  [
    ["MAIN GAME", r.base],
    [theme.bonus1.toUpperCase(), r.bonus1],
    [theme.bonus2.toUpperCase(), r.bonus2],
  ].forEach(([name, value], i) => {
    c.frame(93 + i * 307, 397, 293, 99, theme.background);
    scene.text(String(name), 239 + i * 307, 414, 12, theme.accent, true);
    scene.text(`${value} CREDITS`, 239 + i * 307, 448, 24, "#fff7de", true);
  });
  scene.text(
    `WINNINGS COLLECTED · BALANCE ${client.state!.player.balance} CREDITS`,
    550,
    528,
    18,
    theme.accent,
    true,
  );
  button(
    `PLAY AGAIN · ${config?.cost || 10} CREDITS`,
    320,
    611,
    460,
    () =>
      void request("round.start", {
        gameId: theme.id,
        scenario: select.value,
        seed: Number(seedInput.value),
      }),
    client.state!.player.balance >= (config?.cost || 10),
    48,
  );
}
