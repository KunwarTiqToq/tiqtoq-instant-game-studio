import { Container, FillGradient, Graphics, Text } from "pixi.js";
import { gsap } from "gsap";
import type { ScreenContext } from "../ui/screen-context";

const gradients = new Map<string, FillGradient>();
function cachedGradient(key: string, create: () => FillGradient) {
  let result = gradients.get(key);
  if (!result) {
    result = create();
    gradients.set(key, result);
  }
  return result;
}
export class Cabinet {
  constructor(public ctx: ScreenContext) {}
  get scene() {
    return this.ctx.scene;
  }
  get theme() {
    return this.ctx.theme;
  }
  frame(
    x: number,
    y: number,
    w: number,
    h: number,
    fill = this.theme.panel,
    bulbs = false,
    parent = this.ctx.layer,
  ) {
    const trim = this.theme.presentation.trim;
    const grad = cachedGradient(
      "frame-" + trim,
      () =>
        new FillGradient({
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
          colorStops: [
            { offset: 0, color: "#fff2b3" },
            { offset: 0.22, color: trim },
            { offset: 0.48, color: "#654021" },
            { offset: 0.72, color: trim },
            { offset: 1, color: "#fff4c2" },
          ],
        }),
    );
    const outer = new Graphics()
      .roundRect(x, y, w, h, 12)
      .fill(
        this.theme.presentation.layout === "neon-grid" ? this.theme.tile : grad,
      )
      .stroke({ color: trim, width: 2 });
    parent.addChild(outer);
    this.scene.panel(x + 6, y + 6, w - 12, h - 12, fill, trim, 8, parent);
    this.scene.panel(
      x + 10,
      y + 10,
      w - 20,
      h - 20,
      "#00000000",
      "#ffffff30",
      5,
      parent,
    );
    if (bulbs) {
      const lights = new Graphics();
      for (let i = 0; i <= Math.floor(w / 24); i++) {
        const px = x + 12 + (i * (w - 24)) / Math.floor(w / 24);
        lights.circle(px, y + 3, 2.6).circle(px, y + h - 3, 2.6);
      }
      for (let i = 1; i < Math.floor(h / 24); i++) {
        const py = y + i * 24;
        lights.circle(x + 3, py, 2.6).circle(x + w - 3, py, 2.6);
      }
      lights.fill("#fff1a6");
      parent.addChild(lights);
    }
    return outer;
  }
  title(
    text: string,
    x: number,
    y: number,
    size = 40,
    center = false,
    parent = this.ctx.layer,
  ) {
    const fill = cachedGradient(
      "title-" + this.theme.id,
      () =>
        new FillGradient({
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
          colorStops: [
            { offset: 0, color: "#ffffff" },
            { offset: 0.38, color: this.theme.accent },
            { offset: 0.55, color: "#ffffff" },
            { offset: 1, color: this.theme.presentation.trim },
          ],
        }),
    );
    const node = new Text({
      text,
      style: {
        fontFamily: this.theme.titleFont,
        fontSize: size,
        fontWeight: "900",
        fill,
        stroke: { color: this.theme.background, width: 5 },
        dropShadow: { color: "#000000", alpha: 0.8, blur: 3, distance: 3 },
        align: center ? "center" : "left",
        lineHeight: size * 1.03,
      },
    });
    node.position.set(x, y);
    if (center) node.anchor.set(0.5, 0);
    node.label = text;
    parent.addChild(node);
    return node;
  }
  plate(text: string, x: number, y: number, w: number, h = 34) {
    this.scene.panel(
      x,
      y,
      w,
      h,
      this.theme.tile,
      this.theme.presentation.trim,
      8,
    );
    this.scene.text(text, x + w / 2, y + (h - 20) / 2, 16, "#fff6df", true);
  }
  pips(x: number, y: number, count: number, total: number, size = 12) {
    for (let i = 0; i < total; i++) {
      const dot = new Graphics()
        .circle(x + i * (size * 2 + 8), y, size)
        .fill(i < count ? this.theme.accent : "#050917")
        .stroke({ color: this.theme.presentation.trim, width: 2 });
      this.ctx.layer.addChild(dot);
      if (
        i < count &&
        this.ctx.revealIndices.length &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        gsap.from(dot, { alpha: 0.15, duration: 0.14, repeat: 1, yoyo: true });
    }
  }
  tile(
    index: number,
    x: number,
    y: number,
    w: number,
    h: number,
    value: number | null,
    kind: "symbol" | "number",
    preview = false,
  ) {
    const { ctx, scene, theme } = this;
    const tile = new Container();
    tile.pivot.set(w / 2, h / 2);
    tile.position.set(x + w / 2, y + h / 2);
    const isNumber = kind === "number";
    const grad = cachedGradient(
      "tile-" + theme.id + isNumber,
      () =>
        new FillGradient({
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
          colorStops: [
            { offset: 0, color: isNumber ? "#fff1b6" : theme.tile },
            { offset: 0.5, color: isNumber ? "#d3a143" : theme.panel },
            { offset: 1, color: isNumber ? "#fff3bc" : theme.background },
          ],
        }),
    );
    tile.addChild(
      new Graphics()
        .roundRect(0, 0, w, h, 6)
        .fill(grad)
        .stroke({ color: theme.presentation.trim, width: 3 }),
    );
    scene.panel(4, 4, w - 8, h - 8, "#00000000", "#ffffff40", 3, tile);
    if (value === null) {
      if (isNumber)
        scene.text(
          "?",
          w / 2,
          5,
          Math.min(42, (h - 32) * 0.95),
          "#67451b",
          true,
          tile,
        );
      else {
        scene.image(
          ctx.textures[theme.id === "star-quest" ? 4 : 7],
          w / 2,
          (h - 28) / 2,
          Math.min(w * 0.52, (h - 31) * 0.92),
          "Covered chance",
          tile,
        );
      }
      const cap = isNumber
        ? "PRIZE"
        : theme.id === "star-quest"
          ? "REVEAL"
          : "CHANCE " + (index + 1);
      scene.panel(
        3,
        h - 29,
        w - 6,
        26,
        isNumber ? "#9e1721" : "#081b36c0",
        theme.presentation.trim,
        2,
        tile,
      );
      scene.text(
        cap,
        w / 2,
        h - 25,
        13,
        isNumber ? "#fff2ba" : "#ffffff",
        true,
        tile,
      );
      scene.target(
        tile,
        `Chance ${index + 1}`,
        () => ctx.action("reveal", index, "reveal"),
        !ctx.busy && !preview,
      );
    } else if (isNumber) {
      const match = ctx.config?.winningNumbers?.includes(value);
      scene.text(
        String(value).padStart(2, "0"),
        w / 2,
        4,
        Math.min(42, (h - 32) * 0.95),
        "#19252e",
        true,
        tile,
      );
      scene.panel(
        3,
        h - 29,
        w - 6,
        26,
        match ? "#075c3a" : "#621b24",
        theme.presentation.trim,
        2,
        tile,
      );
      scene.text(
        match ? `${ctx.config?.matchPrize} CREDITS` : "NO MATCH",
        w / 2,
        h - 25,
        12,
        "#fff6da",
        true,
        tile,
      );
      tile.label = `Chance ${index + 1}: number ${value}`;
    } else {
      scene.image(
        ctx.textures[value],
        w / 2,
        (h - 28) / 2,
        Math.min(w * 0.58, (h - 31) * 0.92),
        ctx.symbols[value],
        tile,
      );
      const caption =
        theme.id === "treasure-chances"
          ? value === 7
            ? `${ctx.config?.matchPrize} · MATCH 3`
            : value === 3
              ? "BELL · COLLECT"
              : value === 4
                ? "STAR · COLLECT"
                : ctx.symbols[value].toUpperCase()
          : value === 4
            ? `${ctx.config?.matchPrize} CREDITS`
            : ctx.symbols[value].toUpperCase();
      scene.panel(
        3,
        h - 28,
        w - 6,
        25,
        "#060c24d9",
        theme.presentation.trim,
        2,
        tile,
      );
      scene.text(caption, w / 2, h - 24, 11, "#fff7dc", true, tile);
      tile.label = `Chance ${index + 1}: ${ctx.symbols[value]}`;
    }
    ctx.layer.addChild(tile);
    if (
      !preview &&
      ctx.revealIndices.includes(index) &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      gsap.from(tile.scale, {
        x: 0.03,
        duration: theme.presentation.animation.revealMs / 1000,
        ease: "back.out(1.3)",
        delay: (index % 4) * 0.025,
      });
      gsap.from(tile, {
        alpha: 0.15,
        duration: theme.presentation.animation.revealMs / 1000,
      });
    }
    return tile;
  }
  ladder(
    x: number,
    y: number,
    w: number,
    h: number,
    values: string[],
    active: number,
  ) {
    const gap = 6,
      row = (h - gap * (values.length - 1)) / values.length;
    values.forEach((value, i) => {
      const filled = active >= i + 1;
      this.scene.panel(
        x,
        y + (values.length - 1 - i) * (row + gap),
        w,
        row,
        filled ? this.theme.accent : this.theme.tile,
        this.theme.presentation.trim,
        4,
      );
      this.scene.text(
        value,
        x + w / 2,
        y + (values.length - 1 - i) * (row + gap) + row / 2 - 10,
        14,
        filled ? "#11172a" : "#f4e8d2",
        true,
      );
    });
  }
  go(
    x: number,
    y: number,
    label: string,
    caption: string,
    run: () => void,
    enabled: boolean,
  ) {
    const c = new Container();
    c.position.set(x, y);
    const trim = this.theme.presentation.trim;
    c.addChild(
      new Graphics()
        .circle(0, 0, 67)
        .fill(this.theme.tile)
        .stroke({ color: trim, width: 5 })
        .circle(0, 0, 55)
        .fill(this.theme.panel)
        .stroke({ color: "#ffffff", width: 2 })
        .circle(0, 0, 47)
        .stroke({ color: this.theme.accent, width: 3 }),
    );
    this.title(label, 0, -23, 30, true, c);
    this.scene.text(caption, 0, 79, 13, this.theme.accent, true, c);
    this.scene.target(c, caption, run, enabled);
    this.ctx.layer.addChild(c);
  }
}
export function boardState(ctx: ScreenContext) {
  const round = ctx.currentRound();
  return !ctx.preview && round
    ? round
    : {
        tiles: Array(ctx.config?.tileCount || 9).fill(null) as (
          number | null
        )[],
        progress: 0,
        secondary: 0,
        first: false,
        second: false,
        base: 0,
        total: 0,
      };
}
export function mainAction(
  ctx: ScreenContext,
  x: number,
  y: number,
  w: number,
) {
  if (ctx.preview) return;
  const round = ctx.currentRound()!;
  const left = round.tiles.some((v) => v === null);
  ctx.button(
    left
      ? "REVEAL ALL REMAINING"
      : round.first || round.second
        ? "ENTER YOUR BONUS"
        : "COLLECT YOUR RESULT",
    x,
    y,
    w,
    ctx.continueAction(left ? "reveal-all" : "continue"),
    true,
    48,
  );
}
