import { createServer, preview } from "vite";
import { resolve } from "node:path";
import { studioRoot, loadEnvironment, settings } from "./runtime.mjs";
loadEnvironment();
const { studioPort } = settings();
const options = {
  root: studioRoot,
  configFile: resolve(studioRoot, "vite.config.mjs"),
  server: { port: studioPort, strictPort: true },
  preview: { port: studioPort, strictPort: true },
};
const app = process.argv.includes("--preview")
  ? await preview(options)
  : await createServer(options);
if (app.listen) await app.listen();
app.printUrls();
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    if (app.close) await app.close();
    else
      await new Promise((resolveClose) => app.httpServer.close(resolveClose));
    process.exit(0);
  });
