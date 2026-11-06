import type { ScreenContext } from "../screen-context";
import { Cabinet } from "../../rendering/cabinet";
import { displayedTotal } from "./results";
export function renderChrome(ctx: ScreenContext) {
  const { scene, theme, currentRound, audio, busy, render } = ctx,
    c = new Cabinet(ctx),
    r = currentRound();
  scene.panel(15, 12, 1070, 126, "#030a16a8", theme.presentation.trim, 14);
  c.title(theme.name.toUpperCase().replace(" ", "\n"), 48, 20, 38);
  const headings = {
    "treasure-chances": "MATCH · REVEAL · COLLECT",
    "lucky-numbers": "MATCH YOUR NUMBERS. OPEN THE VAULT.",
    "star-quest": "LIGHT UP YOUR GALAXY",
  };
  scene.text(headings[theme.id], 625, 37, 15, "#fff7de", true);
  const labels = [
    "MAIN GAME",
    theme.bonus1.toUpperCase(),
    theme.bonus2.toUpperCase(),
  ];
  labels.forEach((label, i) => {
    const active = (r?.phase || "reveal") === ["reveal", "bonus1", "bonus2"][i];
    scene.panel(
      320 + i * 202,
      76,
      190,
      38,
      active ? theme.tile : "#030b19c0",
      active ? theme.accent : "#7c7793",
      5,
    );
    scene.text(
      label,
      415 + i * 202,
      87,
      12,
      active ? "#fff7df" : "#b5b4c9",
      true,
    );
  });
  scene.button(
    audio.muted ? "SOUND OFF" : "SOUND ON",
    957,
    24,
    106,
    () => {
      if (!busy)
        void audio
          .toggle()
          .then(render)
          .catch(() => {
            ctx.setMessage("Sound could not start. Try again.");
            render();
          });
    },
    !busy,
    35,
    true,
  );
  scene.button(
    "ⓘ INFO",
    957,
    72,
    106,
    () => {
      if (!busy) {
        ctx.setInfo(true);
        render();
      }
    },
    !busy,
    35,
    true,
  );
}
export function renderFooter(ctx: ScreenContext, message: string) {
  const { scene, theme, client, config, currentRound } = ctx;
  scene.panel(16, 673, 1068, 53, "#050918ed", theme.presentation.trim, 7);
  const round = currentRound();
  const balance = client.state?.player.balance;
  const items = [
    ["PLAY COST", String(config?.cost || 10)],
    [
      "BALANCE",
      ctx.faults.has("broken-text") && balance !== undefined
        ? String(Number(`${balance} credits`))
        : String(balance ?? "—"),
    ],
    ["TOTAL WIN", String(round ? displayedTotal(ctx, round) : 0)],
  ];
  items.forEach(([name, value], i) => {
    scene.text(name, 37 + i * 147, 681, 10, "#c5bfd1");
    scene.text(value, 37 + i * 147, 697, 21, theme.accent);
  });
  scene.text(
    message.length > 78 ? message.slice(0, 75) + "…" : message,
    490,
    686,
    14,
    "#fff3df",
  );
  scene.text(
    `ROUND ${currentRound()?.number || "—"} · DEMONSTRATION CREDITS`,
    490,
    709,
    9,
    "#b1aabe",
  );
}
