import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
export const root = fileURLToPath(new URL("..", import.meta.url));
export const studioRoot = resolve(root, "apps/studio");
export const bundledServer = resolve(root, "apps/server");
export function loadEnvironment(env = process.env) {
  // Explicit shell settings win, then root settings, then legacy leaf settings.
  for (const file of [
    resolve(root, ".env"),
    resolve(bundledServer, ".env"),
    resolve(studioRoot, ".env"),
  ]) {
    if (existsSync(file))
      for (const [key, value] of Object.entries(
        parseEnv(readFileSync(file, "utf8")),
      )) {
        if (env[key] === undefined) env[key] = value;
      }
  }
}
export function settings(env = process.env) {
  let serverRoot = resolve(root, env.GAME_SERVER_DIR || bundledServer);
  const legacy = resolve(root, "..", "tiqtoq-instant-game-server");
  const key = (value) =>
    process.platform === "win32" ? value.toLowerCase() : value;
  if (key(serverRoot) === key(legacy)) serverRoot = bundledServer;
  const port = Number(env.GAME_SERVER_PORT || 5555);
  const studioPort = Number(env.STUDIO_PORT || 7777);
  for (const value of [port, studioPort])
    if (!Number.isInteger(value) || value < 1024 || value > 65535) {
      throw new Error("Ports must be integers between 1024 and 65535.");
    }
  if (port === studioPort)
    throw new Error("GAME_SERVER_PORT and STUDIO_PORT must be different.");
  return { serverRoot, port, studioPort };
}
