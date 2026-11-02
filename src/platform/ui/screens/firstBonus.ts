import type { ScreenContext } from "../screen-context";
import { Cabinet } from "../../rendering/cabinet";
export function renderFirstBonus(ctx: ScreenContext) {
  const { theme, scene, layer, textures, busy, currentRound, action, button } =
      ctx,
    r = currentRound()!,
    c = new Cabinet(ctx);
  const isStars = theme.id === "star-quest",
    isNumbers = theme.id === "lucky-numbers",
    complete = r.choices.length >= (isStars ? 3 : 1);
  c.frame(35, 153, 1030, 441, theme.panel, theme.id === "lucky-numbers");
  scene.text("BONUS GAME 1", 550, 168, 13, theme.accent, true);
  c.title(theme.bonus1.toUpperCase(), 550, 190, 35, true);
  scene.text(
    isStars
      ? `${3 - r.choices.length} EXTRA PICKS LEFT · CHOOSE THREE DIFFERENT STARS`
      : isNumbers
        ? "PICK A MULTIPLIER TO BOOST YOUR MATCH PRIZE"
        : "CHOOSE A TREASURE CHEST TO REVEAL YOUR PRIZE",
    550,
    241,
    16,
    "#fff4d6",
    true,
  );
  for (let i = 0; i < 5; i++) {
    const x = 65 + i * 196,
      selected = r.choices.includes(i),
      value = r.firstChoices[i];
    const card = c.frame(
      x,
      283,
      185,
      265,
      selected ? theme.tile : theme.background,
    );
    if (!complete && !selected)
      scene.target(
        card,
        `Pick ${theme.bonus1} ${i + 1}`,
        () => action("pick", i, "reveal"),
        !busy,
      );
    if (theme.id === "treasure-chances")
      scene.chest(
        x + 92,
        376,
        value !== null,
        selected,
        () => action("pick", i, "reveal"),
        !busy && !complete,
        `Chest ${i + 1}`,
      );
    else if (isNumbers)
      c.title(value === null ? "× ?" : `× ${value}`, x + 92, 332, 58, true);
    else
      scene.image(
        textures[value === null ? 4 : 5],
        x + 92,
        370,
        100,
        value === null ? "Star" : "Diamond",
      );
    if (value !== null) {
      scene.text(
        isNumbers ? `${value}× MULTIPLIER` : `${value} CREDITS`,
        x + 92,
        456,
        16,
        selected ? "#fff4b5" : "#bac2d3",
        true,
      );
      scene.text(
        selected ? "YOUR PRIZE" : "NOT PICKED",
        x + 92,
        512,
        10,
        selected ? theme.accent : "#b0a8be",
        true,
      );
    } else
      button(
        `${isStars ? "STAR" : isNumbers ? "CARD" : "CHEST"} ${i + 1}`,
        x + 15,
        481,
        155,
        () => action("pick", i, "reveal"),
        !complete,
        39,
      );
  }
  if (complete)
    button(
      r.second
        ? `CONTINUE TO ${theme.id === "treasure-chances" ? "THE WHEEL" : theme.id === "lucky-numbers" ? "THE VAULT" : "CONSTELLATION"}`
        : "COLLECT YOUR RESULT",
      230,
      610,
      640,
      () => action("continue"),
      true,
      48,
    );
  else
    scene.text(
      isStars
        ? "COLLECT ALL THREE PRIZES TO CONTINUE"
        : "ONE CHOICE. YOUR NEXT PRIZE IS WAITING.",
      550,
      625,
      16,
      theme.accent,
      true,
    );
}
