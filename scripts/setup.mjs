import { spawnSync } from "node:child_process";
import { root } from "./runtime.mjs";
if (Number(process.versions.node.split(".")[0]) < 24)
  throw new Error("Install Node.js 24 or newer first.");
if (!process.env.npm_execpath)
  throw new Error("Run this script using npm run setup.");
const result = spawnSync(
  process.execPath,
  [process.env.npm_execpath, "ci", "--workspaces", "--include-workspace-root"],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log("Setup complete. Run npm start from the repository root.");
