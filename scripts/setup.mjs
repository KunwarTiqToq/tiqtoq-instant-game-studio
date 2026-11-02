import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const server = resolve(
  process.env.GAME_SERVER_DIR ||
    resolve(root, "..", "tiqtoq-instant-game-server"),
);
if (Number(process.versions.node.split(".")[0]) < 24)
  throw new Error("Install Node.js 24 or newer first.");
if (!existsSync(resolve(server, "package.json")))
  throw new Error(`Missing game server: ${server}`);
if (!process.env.npm_execpath)
  throw new Error("Run this script using npm run setup.");
for (const cwd of [server, root]) {
  console.log(`Installing dependencies in ${cwd}`);
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "ci"], {
    cwd,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status) process.exit(result.status || 1);
}
console.log("Setup complete. Run npm start.");
