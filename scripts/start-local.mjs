import { existsSync } from "node:fs";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "vite";
import { root, studioRoot, loadEnvironment, settings } from "./runtime.mjs";
loadEnvironment();
const { serverRoot, port, studioPort } = settings();
let owned;
let frontend;
const urlFile = resolve(root, process.env.STUDIO_URL_FILE || ".local/studio-url.json");
async function close() {
  try {
    const published = JSON.parse(await readFile(urlFile, "utf8"));
    if (published.pid === process.pid) await unlink(urlFile);
  } catch (error) {
    if (error.code !== "ENOENT") console.error(error.message);
  }
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
        `Game server not found at ${serverRoot}. Run npm run setup from the repository root, or check GAME_SERVER_DIR.`,
      );
    const { createGameServer } = await import(pathToFileURL(entry).href);
    owned = createGameServer({
      startingCredits: Number(process.env.STARTING_CREDITS || 1000),
    });
    owned.server.listen(port, "127.0.0.1");
    await once(owned.server, "listening");
  }
  frontend = await createServer({
    root: studioRoot,
    configFile: resolve(studioRoot, "vite.config.mjs"),
    server: { port: studioPort, strictPort: false },
  });
  await frontend.listen();
  const url = frontend.resolvedUrls?.local[0];
  if (!url) throw new Error("The studio did not publish a local URL.");
  await mkdir(dirname(urlFile), { recursive: true });
  const temporaryUrlFile = `${urlFile}.${process.pid}.tmp`;
  await writeFile(
    temporaryUrlFile,
    JSON.stringify({
      url,
      pid: process.pid,
      service: "tiqtoq-instant-game-server",
      healthPath: "/api/health",
    }) + "\n",
  );
  await rename(temporaryUrlFile, urlFile);
  console.log(
    `\ntiQtoQ Instant Game Studio\n${url}\nThree games · in-memory credits · no database\nCtrl+C stops the services started by this launcher.\n`,
  );
  console.log(
    "Canvas Tester project URLs (use these while the studio is running):",
  );
  for (const game of ["treasure-chances", "lucky-numbers", "star-quest"])
    console.log(
      new URL(`games/${game}/?scenario=double-bonus&seed=7`, url).href,
    );
  console.log();
  console.log(`Actual URL for automated tests: ${urlFile}\n`);
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
