import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { root } from "../scripts/runtime.mjs";
import { createGameServer } from "../apps/server/src/server.mjs";

test(
  "multiple launchers skip occupied ports and report the actual usable URL",
  { timeout: 30000 },
  async () => {
    const blocker = createServer((socket) => socket.destroy());
    blocker.listen(0, "127.0.0.1");
    await once(blocker, "listening");
    const occupied = blocker.address().port;
    const backend = createGameServer();
    backend.server.listen(0, "127.0.0.1");
    await once(backend.server, "listening");
    const children = [];
    const urls = new Set();
    try {
      for (const script of [
        "scripts/start-local.mjs",
        "scripts/start-local.mjs",
        "scripts/studio-only.mjs",
      ]) {
        const child = spawn(process.execPath, [script, "--no-open"], {
          cwd: root,
          env: {
            ...process.env,
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
          url = output.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];
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
      backend.close();
      await new Promise((resolve) => blocker.close(resolve));
    }
  },
);
