import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "vite";
const root = fileURLToPath(new URL("..", import.meta.url));
if (existsSync(resolve(root, ".env")))
  process.loadEnvFile(resolve(root, ".env"));
const serverRoot = resolve(
  process.env.GAME_SERVER_DIR ||
    resolve(root, "..", "tiqtoq-instant-game-server"),
);
const port = Number(process.env.GAME_SERVER_PORT || 5555),
  studioPort = Number(process.env.STUDIO_PORT || 7777);
for (const value of [port, studioPort])
  if (!Number.isInteger(value) || value < 1024 || value > 65535)
    throw new Error("Ports must be integers between 1024 and 65535.");
let owned;
let frontend;
async function close() {
  await frontend?.close();
  owned?.close();
}
try {
  let health;
  try {
    health = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(1200),
    });
  } catch {
    /* Start our own server below. */
  }
  if (health) {
    const value = await health.json().catch(() => ({}));
    if (
      value.service !== "tiqtoq-instant-game-server" ||
      value.protocol !== 1 ||
      !value.ready
    )
      throw new Error(
        `Port ${port} is occupied by a different service. Stop it or set GAME_SERVER_PORT.`,
      );
    console.log("Reusing the running tiQtoQ game server.");
  } else {
    const entry = resolve(serverRoot, "src/server.mjs");
    if (!existsSync(entry))
      throw new Error(
        `Game server not found at ${serverRoot}. Put both renamed repositories beside each other, or set GAME_SERVER_DIR.`,
      );
    const { createGameServer } = await import(pathToFileURL(entry).href);
    owned = createGameServer({
      startingCredits: Number(process.env.STARTING_CREDITS || 1000),
    });
    owned.server.listen(port, "127.0.0.1");
    await once(owned.server, "listening");
  }
  frontend = await createServer({
    root,
    configFile: resolve(root, "vite.config.mjs"),
    server: { port: studioPort, strictPort: true },
  });
  await frontend.listen();
  const url = `http://127.0.0.1:${studioPort}/`;
  console.log(
    `\ntiQtoQ Instant Game Studio\n${url}\nThree games · in-memory credits · no database\nCtrl+C stops the services started by this launcher.\n`,
  );
  if (!process.argv.includes("--no-open")) {
    const child =
      process.platform === "win32"
        ? spawn(
            "powershell.exe",
            [
              "-NoProfile",
              "-WindowStyle",
              "Hidden",
              "-Command",
              `Start-Process '${url}'`,
            ],
            { windowsHide: true, stdio: "ignore" },
          )
        : spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], {
            stdio: "ignore",
          });
    child.on("error", () => console.log(`Open ${url} in your browser.`));
    child.unref();
  }
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => void close().then(() => process.exit(0)));
} catch (error) {
  await close();
  console.error(`Cannot start the studio: ${error.message}`);
  process.exitCode = 1;
}
