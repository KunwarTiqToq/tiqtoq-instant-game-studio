import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionStore } from "../src/sessions/session-store.mjs";
import { dispatch } from "../src/protocol/dispatch.mjs";
import { games, SCENARIOS } from "../src/games/catalogue.mjs";
import { createGameServer } from "../src/server.mjs";
import { once } from "node:events";
import { WebSocket } from "ws";
import * as numberRules from "../src/games/lucky-numbers/rules.mjs";
test("custom winning numbers and match prizes drive the number game", () => {
  const config = {
    ...games["lucky-numbers"],
    winningNumbers: [1, 2, 3],
    matchPrize: 37,
  };
  const layout = numberRules.layout("double-bonus", config);
  const outcome = numberRules.evaluate(layout, config);
  assert.equal(layout.length, config.tileCount);
  assert.equal(outcome.base, 111);
  assert.equal(outcome.first, true);
  assert.equal(outcome.second, true);
  assert.equal(
    numberRules.evaluate(numberRules.layout("lose", config), config).base,
    0,
  );
});
test("insufficient credits and session capacity fail without creating a round", () => {
  const { store, open, send } = fixture();
  store.sessions.get(open.sessionId).balance = 9;
  assert.throws(
    () => send("round.start", { gameId: "treasure-chances" }),
    /Not enough/,
  );
  assert.equal(store.sessions.get(open.sessionId).round, null);
  const limited = new SessionStore({ maxSessions: 1 });
  limited.open();
  assert.throws(() => limited.open(), /limit/);
});
function fixture() {
  const store = new SessionStore();
  let id = 0;
  const open = dispatch(store, {
    type: "session.open",
    requestId: `request-${id++}`,
  });
  const send = (type, payload, requestId = `request-${id++}`) =>
    dispatch(store, {
      type,
      payload,
      requestId,
      sessionId: open.sessionId,
      token: open.token,
    });
  return { store, open, send };
}
function complete(send, gameId, scenario = "double-bonus", seed = 7) {
  let state = send("round.start", { gameId, scenario, seed });
  const roundId = state.round.id;
  const act = (action, index) =>
    send("round.action", { roundId, action, index });
  state = act("reveal-all");
  state = act("continue");
  if (state.round.phase === "bonus1") {
    for (let i = 0; i < (gameId === "star-quest" ? 3 : 1); i++)
      state = act("pick", i);
    state = act("continue");
  }
  if (state.round.phase === "bonus2") {
    state = gameId === "treasure-chances" ? act("spin") : act("pick", 0);
    state = act("continue");
  }
  return state;
}
test("all games and scenarios complete with accurate single-credit settlement", () => {
  for (const gameId of Object.keys(games))
    for (const scenario of SCENARIOS) {
      const { send } = fixture();
      const result = complete(send, gameId, scenario);
      assert.equal(result.round.phase, "result");
      assert.equal(
        result.player.balance,
        1000 - games[gameId].cost + result.round.total,
      );
      assert.equal(result.history.length, 1);
      const again = send("round.action", {
        roundId: result.round.id,
        action: "continue",
      });
      assert.equal(again.player.balance, result.player.balance);
      assert.equal(again.history.length, 1);
      if (scenario === "lose") assert.equal(result.round.total, 0);
      if (scenario === "double-bonus") {
        assert.equal(result.round.first, true);
        assert.equal(result.round.second, true);
        assert.ok(result.round.bonus1 > 0);
        assert.ok(result.round.bonus2 > 0);
      }
    }
});
test("seed and choices reproduce the same outcome across independent sessions", () => {
  for (const gameId of Object.keys(games)) {
    const left = complete(fixture().send, gameId),
      right = complete(fixture().send, gameId);
    assert.deepEqual(left.round.tiles, right.round.tiles);
    assert.equal(left.round.total, right.round.total);
  }
});
test("hides unrevealed outcomes; rejects invalid, premature and out-of-phase actions", () => {
  const { send } = fixture();
  const state = send("round.start", {
    gameId: "treasure-chances",
    scenario: "double-bonus",
    seed: 7,
  });
  const roundId = state.round.id;
  assert.deepEqual(state.round.tiles, Array(9).fill(null));
  assert.deepEqual(state.round.firstChoices, []);
  assert.equal(state.round.wheelIndex, null);
  assert.equal(state.round.deck, undefined);
  assert.throws(() => send("round.start", { gameId: "star-quest" }), /Finish/);
  assert.throws(
    () => send("round.action", { roundId, action: "continue" }),
    /Reveal/,
  );
  for (const index of [-1, 9, 1.5])
    assert.throws(() =>
      send("round.action", { roundId, action: "reveal", index }),
    );
  assert.throws(() => send("round.action", { roundId, action: "spin" }));
  send("round.action", { roundId, action: "reveal", index: 0 });
  const duplicate = send("round.action", {
    roundId,
    action: "reveal",
    index: 0,
  });
  assert.equal(duplicate.round.tiles.filter((x) => x !== null).length, 1);
});
test("deduplicates retried requests and rejects mismatched reuse", () => {
  const { send } = fixture();
  const first = send("round.start", { gameId: "star-quest" }, "stable-request");
  const retry = send("round.start", { gameId: "star-quest" }, "stable-request");
  assert.deepEqual(first, retry);
  assert.equal(retry.player.balance, 990);
  assert.throws(
    () => send("round.start", { gameId: "lucky-numbers" }, "stable-request"),
    /different action/,
  );
});
test("reconnects to the same round, checks session credentials and resets the demo", () => {
  const { store, open, send } = fixture();
  const start = send("round.start", { gameId: "lucky-numbers" });
  const restored = dispatch(store, {
    type: "session.open",
    requestId: "reconnect",
    sessionId: open.sessionId,
    token: open.token,
  });
  assert.equal(restored.round.id, start.round.id);
  assert.equal(restored.player.balance, 990);
  assert.throws(() => store.open(open.sessionId, "wrong-token"), /Invalid/);
  assert.throws(() =>
    send("round.action", { roundId: "stale", action: "reveal", index: 0 }),
  );
  const reset = send("session.reset");
  assert.equal(reset.player.balance, 1000);
  assert.equal(reset.round, null);
});
test("HTTP and WebSocket transports share the same sessions and reject non-local origins", async () => {
  const app = createGameServer();
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const port = app.server.address().port;
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal((await health.json()).storage, "memory");
    const send = (body) =>
      fetch(`http://127.0.0.1:${port}/api/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    const open = await (
      await send({ type: "session.open", requestId: "http-open" })
    ).json();
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws/studio`);
    await once(socket, "open");
    const received = once(socket, "message");
    socket.send(
      JSON.stringify({
        type: "session.state",
        requestId: "ws-state",
        sessionId: open.sessionId,
        token: open.token,
      }),
    );
    assert.equal(JSON.parse((await received)[0]).player.id, open.player.id);
    socket.close();
    const rejected = await fetch(`http://127.0.0.1:${port}/api/action`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://example.org",
      },
      body: "{}",
    });
    assert.equal(rejected.status, 403);
  } finally {
    app.close();
  }
});
