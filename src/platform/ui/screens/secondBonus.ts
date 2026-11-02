import { Container, Graphics } from "pixi.js";
import type { ScreenContext } from "../screen-context";
import { Cabinet } from "../../rendering/cabinet";
export function renderSecondBonus(ctx: ScreenContext) {
  const {
      theme,
      config,
      scene,
      layer,
      busy,
      wheelAnimating,
      currentRound,
      action,
      button,
    } = ctx,
    r = currentRound()!,
    c = new Cabinet(ctx);
  c.frame(35, 153, 1030, 442, theme.panel, theme.id === "lucky-numbers");
  if (theme.id === "treasure-chances") {
    const wheel = new Container();
    wheel.position.set(321, 392);
    wheel.label = "Fortune Wheel";
    config!.bonus2.forEach((amount, i) => {
      const a = -Math.PI / 2 - Math.PI / 6 + (i * Math.PI) / 3,
        b = a + Math.PI / 3;
      wheel.addChild(
        new Graphics()
          .moveTo(0, 0)
          .lineTo(Math.cos(a) * 181, Math.sin(a) * 181)
          .arc(0, 0, 181, a, b)
          .lineTo(0, 0)
          .fill(i % 2 ? theme.tile : theme.background)
          .stroke({ color: theme.presentation.trim, width: 3 }),
      );
      scene.text(
        String(amount),
        Math.cos((a + b) / 2) * 128,
        Math.sin((a + b) / 2) * 128 - 16,
        29,
        "#fff2c9",
        true,
        wheel,
      );
    });
    wheel.addChild(
      new Graphics()
        .circle(0, 0, 42)
        .fill(theme.background)
        .stroke({ color: theme.presentation.trim, width: 5 }),
    );
    scene.star(0, 0, 26, theme.accent, wheel);
    if (r.wheelIndex !== null && !wheelAnimating)
      wheel.rotation = (-r.wheelIndex * Math.PI) / 3;
    layer.addChild(wheel);
    layer.addChild(
      new Graphics().poly([303, 191, 339, 191, 321, 226]).fill(theme.accent),
    );
    scene.text("BONUS GAME 2", 785, 214, 15, theme.accent, true);
    c.title("FORTUNE\nWHEEL", 785, 251, 43, true);
    scene.text(
      `Spin for up to ${Math.max(...config!.bonus2)} extra credits.`,
      785,
      363,
      19,
      "#fff4da",
      true,
    );
    scene.text(
      r.wheelIndex === null
        ? "YOUR GOLDEN CHANCE"
        : wheelAnimating
          ? "GOOD LUCK…"
          : `${r.bonus2} CREDITS WON!`,
      785,
      421,
      24,
      theme.accent,
      true,
    );
    button(
      r.wheelIndex === null ? "SPIN THE WHEEL" : "COLLECT YOUR RESULT",
      594,
      484,
      382,
      () =>
        action(
          r.wheelIndex === null ? "spin" : "continue",
          undefined,
          r.wheelIndex === null ? "spin" : "click",
        ),
      true,
      60,
    );
  } else {
    scene.text("BONUS GAME 2", 550, 167, 13, theme.accent, true);
    c.title(theme.bonus2.toUpperCase(), 550, 188, 33, true);
    scene.text(
      theme.id === "lucky-numbers"
        ? "CHOOSE A VAULT. DISCOVER THE PRIZE INSIDE."
        : "CHOOSE A CONSTELLATION. FOLLOW YOUR WINNING STARS.",
      550,
      236,
      16,
      "#fff6de",
      true,
    );
    for (let i = 0; i < 6; i++) {
      const x = 82 + (i % 3) * 324,
        y = 272 + Math.floor(i / 3) * 147,
        value = r.secondChoices[i];
      const card = c.frame(
        x,
        y,
        287,
        128,
        r.choices.includes(i) ? theme.tile : theme.background,
      );
      if (!r.choices.length)
        scene.target(
          card,
          `Pick ${theme.bonus2} ${i + 1}`,
          () => action("pick", i, "reveal"),
          !busy,
        );
      if (theme.id === "lucky-numbers") {
        scene.panel(
          x + 15,
          y + 19,
          74,
          88,
          "#ad772f",
          theme.presentation.trim,
          8,
        );
        layer.addChild(
          new Graphics()
            .circle(x + 52, y + 62, 24)
            .fill("#613a1a")
            .stroke({ color: "#fff0aa", width: 4 })
            .moveTo(x + 52, y + 38)
            .lineTo(x + 52, y + 86)
            .moveTo(x + 28, y + 62)
            .lineTo(x + 76, y + 62)
            .stroke({ color: "#ffe6a0", width: 3 }),
        );
      } else {
        const shifts = [
          [-7, 0],
          [0, -5],
          [0, 5],
          [4, -7],
          [0, 6],
          [5, 0],
        ];
        scene.star(x + 48, y + 55, 26);
        scene.star(x + 80 + shifts[i][0], y + 26 + shifts[i][1], 10);
        layer.addChild(
          new Graphics()
            .moveTo(x + 48, y + 55)
            .lineTo(x + 80 + shifts[i][0], y + 26 + shifts[i][1])
            .stroke({ color: theme.accent, width: 2 }),
        );
      }
      if (value !== null) {
        scene.text(
          `${value} CREDITS`,
          x + 187,
          y + 45,
          21,
          r.choices.includes(i) ? theme.accent : "#d1c8d3",
          true,
        );
        scene.text(
          r.choices.includes(i) ? "YOUR PRIZE" : "NOT PICKED",
          x + 187,
          y + 82,
          10,
          "#d2c9d0",
          true,
        );
      } else
        button(
          `${theme.id === "lucky-numbers" ? "VAULT" : "STAR MAP"} ${i + 1}`,
          x + 105,
          y + 43,
          162,
          () => action("pick", i, "reveal"),
          !r.choices.length,
          43,
        );
    }
    if (r.choices.length)
      button(
        "COLLECT YOUR RESULT",
        300,
        611,
        500,
        () => action("continue"),
        true,
        48,
      );
  }
}
