import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadEnvironment, settings } from "./runtime.mjs";
loadEnvironment();
const { serverRoot, port } = settings();
const { createGameServer } = await import(
  pathToFileURL(resolve(serverRoot, "src/server.mjs")).href
);
const app = createGameServer({
  startingCredits: Number(process.env.STARTING_CREDITS || 1000),
});
app.server.on("error", (error) => {
  console.error("Game server: " + error.message);
  process.exitCode = 1;
});
app.server.listen(port, "127.0.0.1", () =>
  console.log(
    "tiQtoQ game server · http://127.0.0.1:" +
      port +
      " · in-memory credits · no database",
  ),
);
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, app.close);
