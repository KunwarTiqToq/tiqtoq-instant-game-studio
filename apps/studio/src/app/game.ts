import { renderChrome, renderFooter } from "../platform/ui/screens/chrome";
import type { ScreenContext } from "../platform/ui/screen-context";
import { contentFor } from "../games/content";
import { renderIntro } from "../platform/ui/screens/intro";
import { renderReveal } from "../platform/ui/screens/revealScreen";
import { renderFirstBonus } from "../platform/ui/screens/firstBonus";
import { renderSecondBonus } from "../platform/ui/screens/secondBonus";
import { renderResults } from "../platform/ui/screens/results";
import { renderInformation } from "../platform/ui/screens/information";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import { gsap } from "gsap";
import type { Theme } from "../games/registry";
import { GameClient, type GameConfig } from "../platform/network/client";
import { GameAudio, type Cue } from "../platform/audio/audio";
import { Scene } from "../platform/rendering/scene";
import { activeFaults, SERVER_FAULTS } from "../platform/faults";

const symbols = [
  "Cherries",
  "Lemon",
  "Grapes",
  "Bell",
  "Star",
  "Diamond",
  "Clover",
  "Crown",
  "Horseshoe",
  "Planet",
];
const scenarioNames: Record<string, string> = {
  random: "Mixed rounds",
  "double-bonus": "Both bonuses",
  "first-bonus": "First bonus",
  win: "Ordinary win",
  lose: "Losing round",
};
export async function mountGame(theme: Theme) {
  document.title = `${theme.name} · tiQtoQ Instant Game Studio`;
  document.documentElement.style.setProperty("--accent", theme.accent);
  const root = document.querySelector<HTMLDivElement>("#app")!;
  root.innerHTML = `<main class="play-shell"><nav class="play-nav"><a href="/">← All games</a><span>tiQtoQ <b>INSTANT GAME STUDIO</b></span><a href="#demo-controls">Demo controls ↓</a></nav><div class="game-canvas" aria-busy="true"></div><p class="game-status" role="status" aria-live="polite">Connecting to the local game server…</p><section class="demo-controls" id="demo-controls"><div><span class="eyebrow">YOUR DEMO, YOUR WAY</span><h2>Set the next adventure</h2></div><label>Outcome<select id="scenario">${Object.entries(
    scenarioNames,
  )
    .map(([key, value]) => `<option value="${key}">${value}</option>`)
    .join(
      "",
    )}</select></label><label>Seed<input id="seed" type="number" step="1" min="-2147483647" max="2147483647" value="7"></label><button id="reset">Reset demo</button><button id="reconnect">Reconnect</button></section><p class="small-print">Pretend credits. Original demonstration games. No money or prizes. A server restart clears sessions; refreshing reconnects to your current round.</p><details class="keyboard-tools"><summary>Keyboard game controls</summary><div id="keyboard-actions"></div></details></main>`;
  const status = document.querySelector<HTMLElement>(".game-status")!;
  const host = document.querySelector<HTMLElement>(".game-canvas")!;
  const select = document.querySelector<HTMLSelectElement>("#scenario")!;
  const seedInput = document.querySelector<HTMLInputElement>("#seed")!;
  const reconnect = document.querySelector<HTMLButtonElement>("#reconnect")!;
  const reset = document.querySelector<HTMLButtonElement>("#reset")!;
  const params = new URLSearchParams(location.search);
  select.value =
    params.has("scenario") && params.get("scenario")! in scenarioNames
      ? params.get("scenario")!
      : "random";
  const seedValue = Number(params.get("seed") ?? 7);
  seedInput.value = String(
    Number.isSafeInteger(seedValue) && Math.abs(seedValue) <= 2147483647
      ? seedValue
      : 7,
  );
  const updateUrl = () => {
    const url = new URL(location.href);
    url.searchParams.set("scenario", select.value);
    url.searchParams.set("seed", seedInput.value);
    history.replaceState(null, "", url);
  };
  select.onchange = updateUrl;
  seedInput.onchange = () => {
    if (!seedInput.checkValidity() || !seedInput.value) seedInput.value = "7";
    updateUrl();
  };
  const faults = activeFaults();
  const client = new GameClient();
  const audio = new GameAudio(theme.sound, {
    ignoreMute: faults.has("mute-ignored"),
  });
  if (faults.has("missing-asset"))
    void Assets.load("/shared/sparkle-glow.png").catch(() => undefined);
  let config: GameConfig | undefined;
  let busy = true;
  let connected = false;
  let info = false;
  let message = "Connecting to your adventure…";
  let wheelAnimating = false;
  let revealIndices: number[] = [];
  const app = new Application();
  await Promise.all(
    ["Outfit", "Cinzel", "Orbitron"].map((font) =>
      document.fonts.load(`bold 24px "${font}"`).catch(() => []),
    ),
  );
  await app.init({
    width: 1100,
    height: 740,
    background: theme.background,
    antialias: true,
    resolution: Math.min(devicePixelRatio, 2),
    autoDensity: true,
    preference: "webgl",
  });
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  app.canvas.setAttribute(
    "aria-label",
    `${theme.name}. Keyboard alternatives are below the game.`,
  );
  host.append(app.canvas);
  (window as unknown as Record<string, unknown>).__PIXI_APP__ = app;
  (window as unknown as Record<string, unknown>).__TIQTOQ_AUDIO__ = {
    inspect: () => audio.inspect(),
  };
  const [atlas, backdrop] = await Promise.all([
    Assets.load<Texture>("/shared/symbols.png"),
    Assets.load<Texture>(theme.presentation.backdrop),
  ]);
  const textures = Array.from(
    { length: 10 },
    (_, i) =>
      new Texture({
        source: atlas.source,
        frame: new Rectangle(
          ((i % 5) * atlas.width) / 5,
          (Math.floor(i / 5) * atlas.height) / 2,
          atlas.width / 5,
          atlas.height / 2,
        ),
      }),
  );
  const background = new Sprite(backdrop);
  background.width = 1100;
  background.height = 740;
  app.stage.addChild(background);
  const layer = new Container();
  app.stage.addChild(layer);
  const effects = new Container();
  effects.eventMode = "none";
  app.stage.addChild(effects);
  const scene = new Scene(layer, "Outfit", theme.accent);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function sparkle(count = theme.presentation.animation.particles) {
    if (reduced()) return;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const shape = new Graphics()
        .star(0, 0, 4, 5 + (i % 3), 2)
        .fill(theme.accent);
      shape.position.set(550, 350);
      effects.addChild(shape);
      gsap.to(shape, {
        x: 550 + Math.cos(angle) * (100 + i * 10),
        y: 350 + Math.sin(angle) * (80 + i * 9),
        rotation: angle,
        alpha: 0,
        duration: 0.65 + (i % 3) * 0.1,
        ease: "power2.out",
        onComplete: () => shape.destroy(),
      });
    }
  }
  /** `no-resume`: the round found on load, which the game then ignores. */
  let abandonedRoundId: string | undefined;
  /** `info-hides-progress`: show revealed chances as covered until the next action. */
  let hideProgress = false;
  function currentRound() {
    const round =
      client.state?.round?.gameId === theme.id ? client.state.round : null;
    return round && round.id === abandonedRoundId ? null : round;
  }
  function shownRound() {
    const round = currentRound();
    return hideProgress && round?.phase === "reveal"
      ? {
          ...round,
          tiles: round.tiles.map(() => null),
          progress: 0,
          secondary: 0,
        }
      : round;
  }
  async function sound(cue: Cue) {
    try {
      await audio.unlock();
      audio.play(cue);
    } catch {
      message =
        "Audio is unavailable in this browser. You can continue playing.";
    }
  }
  async function request(type: string, payload?: unknown, cue: Cue = "click") {
    if (busy) return;
    busy = true;
    void sound(cue);
    const previous = currentRound();
    let celebrate = false;
    render();
    try {
      await client.send(type, payload);
      connected = true;
      hideProgress = false;
      const round = currentRound();
      celebrate =
        !!round &&
        (round.total > (previous?.total || 0) ||
          (round.phase !== previous?.phase && round.phase !== "reveal"));
      message = round?.message || "Your fresh adventure is ready.";
      if (
        round &&
        ((!previous?.first && round.first) ||
          (!previous?.second && round.second))
      )
        audio.play("bonus");
      else if (round && round.base > (previous?.base || 0)) audio.play("match");
      if (round?.phase === "result" && previous?.phase !== "result") {
        if (faults.has("loss-celebrated")) audio.play("win");
        else if (!round.total) audio.play("lose");
        else if (!faults.has("no-win-sound")) audio.play("win");
      }
      revealIndices =
        round && round.id === previous?.id
          ? round.tiles.flatMap((value, index) =>
              value !== null && previous.tiles[index] === null ? [index] : [],
            )
          : [];
      if (revealIndices.length && !reduced()) {
        render();
        await new Promise((resolve) =>
          setTimeout(resolve, theme.presentation.animation.revealMs + 110),
        );
      }
      revealIndices = [];
      if (
        round &&
        previous &&
        round.phase !== previous.phase &&
        round.phase !== "reveal" &&
        !reduced()
      ) {
        render();
        await new Promise<void>((resolve) =>
          gsap.fromTo(
            layer,
            { alpha: 0.2 },
            {
              alpha: 1,
              duration: theme.presentation.animation.bonusMs / 1000,
              ease: "power2.out",
              onComplete: resolve,
            },
          ),
        );
      }
      if (
        type === "round.action" &&
        (payload as { action?: string })?.action === "spin"
      ) {
        wheelAnimating = true;
        render();
        const wheel = layer.children.find(
          (child) => child.label === "Fortune Wheel",
        );
        if (wheel) {
          wheel.rotation = 0;
          await new Promise<void>((resolve) =>
            gsap.to(wheel, {
              rotation: Math.PI * 8 - ((round?.wheelIndex || 0) * Math.PI) / 3,
              duration: reduced()
                ? 0.01
                : theme.presentation.animation.wheelMs / 1000,
              ease: "power3.out",
              onComplete: resolve,
            }),
          );
        }
        wheelAnimating = false;
      }
    } catch (error) {
      message =
        error instanceof Error ? error.message : "The action could not finish.";
      if (/fetch|timeout|network|expired/i.test(message)) connected = false;
    } finally {
      busy = false;
      render();
      if (celebrate) sparkle();
    }
  }
  function action(actionName: string, index?: number, cue: Cue = "click") {
    const round = currentRound();
    if (round)
      void request(
        "round.action",
        {
          roundId: round.id,
          action: actionName,
          ...(index === undefined ? {} : { index }),
        },
        cue,
      );
  }
  async function connect() {
    if (connected || !busy) busy = true;
    message = "Connecting to the local game server…";
    render();
    try {
      const response = await fetch("/api/catalogue", {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok)
        throw new Error(
          "Game server is unavailable. Start both projects with npm start.",
        );
      const catalogue = await response.json();
      config = catalogue.games.find((item: GameConfig) => item.id === theme.id);
      if (!config)
        throw new Error("This game is missing from the server catalogue.");
      await client.connect();
      connected = true;
      const found = currentRound();
      if (faults.has("no-resume") && found && found.phase !== "result")
        abandonedRoundId = found.id;
      message = currentRound()?.message || theme.description;
    } catch (error) {
      connected = false;
      message =
        error instanceof Error
          ? error.message
          : "Cannot connect to the game server.";
    } finally {
      busy = false;
      host.setAttribute("aria-busy", "false");
      render();
    }
  }
  reconnect.onclick = () => {
    if (!busy) {
      connected = false;
      void connect();
    }
  };
  reset.onclick = () => {
    if (
      !busy &&
      confirm("Reset your shared demo balance, current round and history?")
    ) {
      if (connected) void request("session.reset");
      else {
        client.forget();
        void connect();
      }
    }
  };
  function button(
    label: string,
    x: number,
    y: number,
    w: number,
    run: () => void,
    enabled = true,
    h = 54,
    secondary = false,
  ) {
    return scene.button(
      label,
      x,
      y,
      w,
      () => {
        if (!busy) run();
      },
      enabled && !busy && connected,
      h,
      secondary,
    );
  }
  function screenContext(): ScreenContext {
    return {
      faults,
      startPayload: () => {
        const server = SERVER_FAULTS.filter((fault) => faults.has(fault));
        return {
          gameId: theme.id,
          scenario: select.value,
          seed: Number(seedInput.value),
          ...(server.length ? { faults: server } : {}),
        };
      },
      theme,
      config,
      client,
      scene,
      layer,
      textures,
      select,
      seedInput,
      busy,
      wheelAnimating,
      revealIndices,
      audio,
      symbols,
      copy: config
        ? contentFor(theme.id, config)
        : {
            intro: "Loading game rules…",
            instructions: "Loading…",
            prizes: "",
          },
      currentRound: shownRound,
      action,
      request,
      button,
      continueAction,
      render,
      setInfo: (value) => {
        if (info && !value && faults.has("info-hides-progress"))
          hideProgress = true;
        info = value;
      },
      setMessage: (value) => {
        message = value;
      },
    };
  }
  function render() {
    for (const child of layer.removeChildren())
      child.destroy({ children: true });
    scene.actions = [];
    const round = currentRound();
    renderChrome(screenContext());
    const other = client.state?.round;
    if (!connected && !busy) {
      scene.text("Your adventure is waiting.", 550, 320, 32, "#fff6df", true);
      scene.text(
        "Check the local server, then press Reconnect below.",
        550,
        380,
        20,
        "#c6c9d8",
        true,
      );
    } else if (
      !round &&
      other &&
      other.phase !== "result" &&
      other.id !== abandonedRoundId
    ) {
      scene.text(
        "An adventure is already in progress.",
        550,
        310,
        29,
        "#fff6df",
        true,
      );
      scene.text(
        "Finish your current game, or use Reset demo to begin again.",
        550,
        365,
        19,
        "#d9d2e2",
        true,
      );
      button("RESUME YOUR GAME", 325, 470, 450, () =>
        location.assign(`/games/${other.gameId}/`),
      );
    } else if (!round) renderIntro(screenContext());
    else if (round.phase === "reveal") renderReveal(screenContext());
    else if (round.phase === "bonus1" && faults.has("bonus-not-shown"))
      renderReveal(screenContext());
    else if (round.phase === "bonus1") renderFirstBonus(screenContext());
    else if (round.phase === "bonus2") renderSecondBonus(screenContext());
    else renderResults(screenContext());
    const shownMessage = busy
      ? wheelAnimating
        ? "The Fortune Wheel is spinning…"
        : revealIndices.length
          ? "Revealing your chances…"
          : "One moment…"
      : message;
    renderFooter(screenContext(), shownMessage);
    if (info) renderInformation(screenContext());
    status.textContent = shownMessage;
    const running = !!round && round.phase !== "result";
    select.disabled = seedInput.disabled = busy || running;
    reconnect.disabled = reset.disabled = busy;
    const keyboard = document.querySelector("#keyboard-actions")!;
    keyboard.replaceChildren();
    for (const entry of scene.actions) {
      const control = document.createElement("button");
      control.textContent = entry.label;
      control.disabled = !entry.enabled;
      control.onclick = entry.run;
      keyboard.append(control);
    }
  }
  function continueAction(name: string): () => void {
    return () =>
      action(name, undefined, name === "reveal-all" ? "reveal" : "click");
  }
  window.addEventListener(
    "pagehide",
    () => {
      gsap.killTweensOf(layer);
      void audio.destroy();
    },
    { once: true },
  );
  render();
  await connect();
}
