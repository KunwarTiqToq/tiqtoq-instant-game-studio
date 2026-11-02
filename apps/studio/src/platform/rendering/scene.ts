import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
export class Scene {
  actions: { label: string; run: () => void; enabled: boolean }[] = [];
  constructor(
    public layer: Container,
    public font = "Outfit",
    public accent = "#f6ce79",
  ) {}
  panel(
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string | number,
    border: string | number = "#ffffff22",
    radius = 18,
    parent = this.layer,
  ) {
    const g = new Graphics()
      .roundRect(x, y, w, h, radius)
      .fill(fill)
      .stroke({ color: border, width: 1.5 });
    parent.addChild(g);
    return g;
  }
  text(
    value: string,
    x: number,
    y: number,
    size = 18,
    color: string | number = "#fff5df",
    center = false,
    parent = this.layer,
    font = this.font,
  ) {
    const t = new Text({
      text: value,
      style: {
        fontFamily: font,
        fontSize: size,
        fill: color,
        fontWeight: size >= 22 ? "bold" : "normal",
        align: center ? "center" : "left",
        lineHeight: size * 1.35,
      },
    });
    t.position.set(x, y);
    if (center) t.anchor.set(0.5, 0);
    t.label = value;
    parent.addChild(t);
    return t;
  }
  image(
    texture: Texture,
    x: number,
    y: number,
    size: number,
    label: string,
    parent = this.layer,
  ) {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    sprite.scale.set(size / Math.max(texture.width, texture.height));
    sprite.label = label;
    parent.addChild(sprite);
    return sprite;
  }
  target(node: Container, label: string, run: () => void, enabled = true) {
    node.label = label;
    node.eventMode = enabled ? "static" : "none";
    node.cursor = enabled ? "pointer" : "default";
    if (enabled) {
      node.on("pointertap", run);
      node.on("pointerover", () => {
        node.alpha = 0.85;
      });
      node.on("pointerout", () => {
        node.alpha = 1;
      });
    }
    this.actions.push({ label, run, enabled });
  }
  button(
    label: string,
    x: number,
    y: number,
    w: number,
    run: () => void,
    enabled = true,
    h = 54,
    secondary = false,
  ) {
    const box = new Container();
    box.position.set(x, y);
    this.panel(
      0,
      0,
      w,
      h,
      secondary ? "#ffffff10" : enabled ? this.accent : "#454059",
      this.accent,
      12,
      box,
    );
    this.text(
      label,
      w / 2,
      h / 2 - 13,
      18,
      secondary ? "#fff5df" : "#16232e",
      true,
      box,
    );
    this.target(box, label, run, enabled);
    this.layer.addChild(box);
    return box;
  }
  chest(
    x: number,
    y: number,
    open: boolean,
    selected: boolean,
    run: () => void,
    enabled: boolean,
    label: string,
  ) {
    const c = new Container();
    c.position.set(x, y);
    if (selected)
      c.addChild(
        new Graphics()
          .circle(0, 0, 65)
          .fill({ color: this.accent, alpha: 0.12 }),
      );
    this.panel(-55, -15, 110, 64, "#86502f", "#f7cf7c", 8, c);
    this.panel(-58, open ? -55 : -35, 116, 42, "#b67b3a", "#ffe4a0", 12, c);
    c.addChild(
      new Graphics().rect(-38, -30, 9, 76).rect(29, -30, 9, 76).fill("#efd18a"),
    );
    this.panel(-11, -10, 22, 26, "#fce1a1", "#bd873f", 4, c);
    c.addChild(new Graphics().circle(0, 0, 4).fill("#3b2938"));
    if (open)
      c.addChild(
        new Graphics()
          .poly([0, -65, 20, -42, 0, -23, -20, -42])
          .fill("#80ddda")
          .stroke({ color: "#d9ffff", width: 2 }),
      );
    this.target(c, label, run, enabled);
    this.layer.addChild(c);
    return c;
  }
  star(
    x: number,
    y: number,
    radius = 30,
    fill: string | number = this.accent,
    parent = this.layer,
  ) {
    const points = Array.from({ length: 10 }, (_, i) => {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 ? radius * 0.45 : radius;
      return [x + Math.cos(angle) * r, y + Math.sin(angle) * r];
    }).flat();
    const shape = new Graphics()
      .poly(points)
      .fill(fill)
      .stroke({ color: "#ffffff88", width: 1 });
    parent.addChild(shape);
    return shape;
  }
}
