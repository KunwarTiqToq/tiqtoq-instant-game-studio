import { themes } from "../games/registry";
import { GameClient } from "../platform/network/client";
export async function mountLobby() {
  document.title = "tiQtoQ · Instant Game Studio";
  const root = document.querySelector("#app")!;
  root.innerHTML = `<main class="lobby"><header class="lobby-nav"><a class="brand" href="/">tiQtoQ<span>INSTANT GAME STUDIO</span></a><span class="local-badge"><i></i> LOCAL PLAYGROUND</span></header><section class="lobby-hero"><p class="eyebrow">SMALL MOMENTS. BRIGHT POSSIBILITIES.</p><h1>Three worlds.<br>A little <em>wonder.</em></h1><p class="hero-copy">Click, uncover and explore. Three original instant-win adventures, made for playful demonstrations.</p><div class="hero-tags"><span>✦ Two bonuses per game</span><span>♫ Sound & music</span><span>◈ Pretend credits</span></div><div class="hero-orbit" aria-hidden="true"><span class="orbit-star">✦</span><span class="orbit-dot"></span><span class="orbit-ring"></span></div></section><section class="session-strip" id="session-strip" role="status">Connecting to your local game server…</section><section class="collection-heading"><div><p class="eyebrow">CHOOSE YOUR ADVENTURE</p><h2>The collection</h2></div><span>01 — 03</span></section><section class="game-grid">${themes.map((theme, i) => `<article class="game-card" data-game-id="${theme.id}" style="--card-accent:${theme.accent}"><a class="card-art" href="/games/${theme.id}/" aria-label="Play ${theme.name}"><img src="${theme.presentation.backdrop}" alt="${theme.name} illustrated world"/><span class="card-number">0${i + 1}</span><span class="card-emblem">${i === 0 ? "♛" : i === 1 ? "07" : "✦"}</span><span class="card-genre">${i === 0 ? "MATCH & REVEAL" : i === 1 ? "NUMBERS & MULTIPLIERS" : "COLLECT & DISCOVER"}</span></a><div class="card-body"><p class="eyebrow">${theme.eyebrow}</p><h3>${theme.name}</h3><p>${theme.description}</p><div class="card-meta"><span>10 credits / round</span><span>2 bonus adventures</span></div><a class="play-link" href="/games/${theme.id}/">Play ${theme.name} <span>↗</span></a><a class="demo-link" href="/games/${theme.id}/?scenario=double-bonus&seed=7">Show both bonuses →</a></div></article>`).join("")}</section><section class="lobby-footer"><div><h2>Built for the moment of discovery.</h2><p>Three distinct mechanics. Clear instructions. Original sound. A simple local platform you can make your own.</p></div><span>NO DATABASE<br>NO REAL MONEY<br>JUST EXPLORATION</span></section><footer>tiQtoQ Instant Game Studio · Original demonstration games · Credits have no monetary value</footer></main>`;
  const status = document.querySelector("#session-strip")!;
  try {
    const health = await fetch("/api/health", {
      signal: AbortSignal.timeout(5000),
    });
    const body = await health.json();
    if (!health.ok || body.service !== "tiqtoq-instant-game-server")
      throw new Error();
    const client = new GameClient();
    await client.connect();
    const catalogueResponse = await fetch("/api/catalogue", {
      signal: AbortSignal.timeout(5000),
    });
    if (!catalogueResponse.ok) throw new Error("Missing game catalogue.");
    const catalogue = await catalogueResponse.json();
    for (const theme of themes) {
      const entry = catalogue.games.find(
        (item: { id: string; cost: number }) => item.id === theme.id,
      );
      const label = document.querySelector(
        `[data-game-id="${theme.id}"] .card-meta span`,
      );
      if (entry && label) label.textContent = `${entry.cost} credits / round`;
    }
    status.replaceChildren();
    const text = document.createElement("span");
    text.textContent = `Server ready · ${client.state!.player.balance.toLocaleString("en-GB")} demo credits · sessions stored in memory`;
    status.append(text);
    if (client.state!.round && client.state!.round.phase !== "result") {
      const link = document.createElement("a");
      link.href = `/games/${client.state!.round.gameId}/`;
      link.textContent = "Resume your current adventure →";
      status.append(link);
    }
  } catch {
    status.textContent =
      "Game server unavailable. Run npm start from the studio folder to start both projects.";
    status.classList.add("offline");
  }
}
