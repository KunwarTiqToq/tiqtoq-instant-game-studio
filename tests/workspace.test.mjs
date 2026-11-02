import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  root,
  bundledServer,
  studioRoot,
  settings,
} from "../scripts/runtime.mjs";
test("bundled application paths and defaults", () => {
  assert.ok(existsSync(resolve(studioRoot, "index.html")));
  assert.ok(existsSync(resolve(bundledServer, "src/server.mjs")));
  assert.deepEqual(settings({}), {
    serverRoot: bundledServer,
    port: 5555,
    studioPort: 7777,
  });
});
test("legacy sibling override resolves to the bundled server", () => {
  assert.equal(
    settings({
      GAME_SERVER_DIR: resolve(root, "..", "tiqtoq-instant-game-server"),
    }).serverRoot,
    bundledServer,
  );
  assert.equal(
    settings({ GAME_SERVER_DIR: "apps/server" }).serverRoot,
    bundledServer,
  );
});
test("custom ports remain supported and conflicting ports fail early", () => {
  assert.equal(
    settings({ GAME_SERVER_PORT: "5556", STUDIO_PORT: "7778" }).port,
    5556,
  );
  for (const value of ["abc", "80", "65536", "5.5"])
    assert.throws(() => settings({ GAME_SERVER_PORT: value }));
  assert.throws(() => settings({ GAME_SERVER_PORT: "7777" }));
});
