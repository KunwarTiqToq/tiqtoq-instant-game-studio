import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import os from "node:os";
import { root } from "../scripts/runtime.mjs";
import { createGameServer } from "../apps/server/src/server.mjs";

test(
  "multiple launchers skip occupied ports and report the actual usable URL",
  { timeout: 30000 },
  async () => {
    const blocker = createServer((socket) => socket.destroy());
    blocker.listen(0, "localhost");
    await once(blocker, "listening");
    const occupied = blocker.address().port;
    const backend = createGameServer();
    backend.server.listen(0, "127.0.0.1");
    await once(backend.server, "listening");
    const stateRoot = await mkdtemp(resolve(os.tmpdir(), "studio-startup-"));
    const children = [];
    const urls = new Set();
    try {
      for (const script of [
        "scripts/start-local.mjs",
        "scripts/start-local.mjs",
        "scripts/studio-only.mjs",
      ]) {
        const publishedFile = resolve(stateRoot, `url-${children.length}.json`);
        const child = spawn(process.execPath, [script, "--no-open"], {
          cwd: root,
          env: {
            ...process.env,
            STUDIO_URL_FILE: publishedFile,
            STUDIO_PORT: String(occupied),
            GAME_SERVER_PORT: String(backend.server.address().port),
          },
          stdio: ["ignore", "pipe", "pipe"],
          windowsHide: true,
        });
        children.push(child);
        let output = "";
        child.stdout.on("data", (data) => (output += data));
        child.stderr.on("data", (data) => (output += data));
        child.on("error", (error) => (output += error.message));
        let url;
        for (let attempt = 0; attempt < 150; attempt++) {
          url = output.match(/http:\/\/localhost:\d+\//)?.[0];
          if (url) break;
          if (child.exitCode !== null) assert.fail(output);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        assert.ok(url, output);
        assert.notEqual(new URL(url).port, String(occupied));
        assert.ok(
          !urls.has(url),
          "Each live frontend needs its own available port",
        );
        urls.add(url);
        if (script === "scripts/start-local.mjs") {
          const published = JSON.parse(
            await readFile(publishedFile, "utf8"),
          );
          assert.equal(published.url, url);
          assert.equal(published.pid, child.pid);
          const links =
            output.match(/http:\/\/localhost:\d+\/games\/[^\s]+/g) || [];
          assert.equal(links.length, 3, output);
          for (const link of links) {
            assert.equal(new URL(link).origin, new URL(url).origin);
            const game = await fetch(link, {
              signal: AbortSignal.timeout(3000),
            });
            assert.equal(game.status, 200);
            assert.match(await game.text(), /<html/);
          }
        }
        const response = await fetch(url, {
          signal: AbortSignal.timeout(3000),
        });
        assert.equal(response.status, 200);
        assert.match(await response.text(), /<html/);
        const health = await fetch(new URL("api/health", url), {
          signal: AbortSignal.timeout(3000),
        });
        assert.equal(
          (await health.json()).service,
          "tiqtoq-instant-game-server",
        );
      }
    } finally {
      for (const child of children)
        if (child.exitCode === null && child.signalCode === null) {
          const closed = once(child, "exit");
          child.kill();
          await closed;
        }
      assert.ok(stateRoot.startsWith(resolve(os.tmpdir())));
      await rm(stateRoot, { recursive: true, force: true });
      backend.close();
      await new Promise((resolve) => blocker.close(resolve));
    }
  },
);
